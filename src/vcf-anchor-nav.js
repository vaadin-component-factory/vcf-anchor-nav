/**
 * @license
 * Copyright (C) 2015 Vaadin Ltd.
 * This program is available under Commercial Vaadin Add-On License 3.0 (CVALv3).
 * See the file LICENSE.md distributed with this software for more information about licensing.
 * See [the website]{@link https://vaadin.com/license/cval-3} for the complete license.
 */

import { html, PolymerElement } from '@polymer/polymer/polymer-element';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';
import { ElementMixin } from '@vaadin/vaadin-element-mixin';
import { smoothScrollPolyfill } from '../lib/common-js-modules.esm';
import '@vaadin/vaadin-license-checker/vaadin-license-checker';
import '@vaadin/vaadin-tabs/vaadin-tabs';
import '@vaadin/vaadin-tabs/vaadin-tab';

/**
 * `<vcf-anchor-nav>`
 * Component with tabs used as anchor navigation and content sections.
 * Automates the linking of tabs and sections.
 *
 * ```html
 * <vcf-anchor-nav>
 *   <vcf-anchor-nav-section name="One">Section 1</vcf-anchor-nav-section>
 *   <vcf-anchor-nav-section name="Two">Section 2</vcf-anchor-nav-section>
 *   <vcf-anchor-nav-section name="Three">Section 3</vcf-anchor-nav-section>
 * </vcf-anchor-nav>
 * ```
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name | Description
 * ----------------|----------------
 * `tabs` | Container for navigation tabs.
 * `header` | Header section above tabs.
 *
 * @memberof Vaadin
 * @mixes ElementMixin
 * @mixes ThemableMixin
 * @demo demo/index.html
 */
class VcfAnchorNav extends ElementMixin(ThemableMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          overflow: auto;
          position: relative;
        }

        ::slotted(vcf-anchor-nav-section:nth-child(odd)) {
          background: var(--lumo-shade-5pct);
        }

        ::slotted([slot='header']) {
          padding: 0 var(--lumo-space-m);
        }

        #tabs {
          position: sticky;
          top: -1px;
          background: var(--lumo-base-color);
        }
      </style>
      <slot name="header" part="header"></slot>
      <vaadin-tabs id="tabs" part="tabs"></vaadin-tabs>
      <slot id="slot"></slot>
    `;
  }

  static get is() {
    return 'vcf-anchor-nav';
  }

  static get version() {
    return '0.1.2';
  }

  static get properties() {
    return {
      /**
       * Index of selected section.
       * @type {Number}
       * @readonly
       */
      selectedIndex: {
        type: Number,
        value: 0,
        observer: '_selectedChanged'
      },
      /**
       * Id of selected section.
       * @type {String}
       */
      selectedId: String
    };
  }

  /**
   * Returns an array of the section elements.
   * @returns {Array<VcfAnchorNavSection>}
   */
  get sections() {
    return this.$.slot.assignedNodes().filter(node => node.tagName === 'VCF-ANCHOR-NAV-SECTION');
  }

  ready() {
    super.ready();
    smoothScrollPolyfill();
    this.$.slot.addEventListener('slotchange', () => this._onSlotChange());
  }

  _onSlotChange() {
    this.$.tabs.innerHTML = '';
    if (this.sections.length) {
      this.sections.forEach((section, i) => {
        const tab = document.createElement('vaadin-tab');
        const a = document.createElement('a');
        section.name = section.name || `Section ${i + 1}`;
        section.id = section.id || section.name.replace(' ', '-').toLowerCase();
        a.innerText = section.name;
        a.id = `${section.id}-anchor`;
        a.href = `#${section.id}`;
        a.addEventListener('click', e => e.preventDefault());
        tab.id = `${section.id}-tab`;
        tab.appendChild(a);
        tab.addEventListener('click', () => {
          this.selectedIndex = i;
          this.scrollTo({
            top: section.offsetTop - this.$.tabs.clientHeight,
            behavior: 'smooth'
          });
          history.pushState(null, null, a.href);
        });
        this.$.tabs.appendChild(tab);
      });
      this._initTabHighlight();
      // Scroll to URL hash if possible
      if (location.hash) {
        const section = this.querySelector(location.hash);
        if (section) this.scrollTo({ top: section.offsetTop - this.$.tabs.clientHeight });
      }
    }
  }

  _initTabHighlight() {
    const callback = (entries, _) => {
      this._clearSelection();
      const firstIntersecting = entries.filter(entry => entry.isIntersecting)[0];
      if (firstIntersecting) this._setNavItemSelected(firstIntersecting.target.id, true);
      else this._setNavItemSelected(this.sections[this.selectedIndex].id, true);
    };
    this.sections.forEach(element => {
      const height = this.clientHeight - this.$.tabs.clientHeight;
      const options = {
        root: this,
        threshold: element.clientHeight > height ? (height / element.clientHeight) * 0.6 : 1
      };
      const observer = new IntersectionObserver(callback, options);
      observer.observe(element);
    });
  }

  _clearSelection() {
    this.$.tabs.querySelectorAll('vaadin-tab').forEach(tab => (tab.selected = false));
  }

  _setNavItemSelected(sectionId, value) {
    const navItem = this.$.tabs.querySelector(`#${sectionId}-tab`);
    if (navItem) {
      navItem.selected = value;
      if (navItem.selected) {
        this.sectionId = sectionId;
        this.selectedIndex = this._getNodeIndex(navItem);
      }
    }
  }

  _getNodeIndex(element) {
    let i = 0;
    while ((element = element.previousSibling) !== null) i++;
    return i;
  }

  _selectedChanged(selectedIndex) {
    this.dispatchEvent(
      new CustomEvent('selected-changed', {
        detail: {
          index: selectedIndex,
          id: this.selectedId
        }
      })
    );
  }

  /**
   * @protected
   */
  static _finalizeClass() {
    super._finalizeClass();
    const devModeCallback = window.Vaadin.developmentModeCallback;
    const licenseChecker = devModeCallback && devModeCallback['vaadin-license-checker'];
    if (typeof licenseChecker === 'function') {
      licenseChecker(VcfAnchorNav);
    }
  }

  /**
   * Fired when the selected tab is changed.
   *
   * @event selected-changed
   * @param {Object} detail
   * @param {Object} detail.id Id of selected section.
   * @param {Object} detail.index Index of selected section.
   */
}

customElements.define(VcfAnchorNav.is, VcfAnchorNav);

/**
 * @namespace Vaadin
 */
window.Vaadin.VcfAnchorNav = VcfAnchorNav;
