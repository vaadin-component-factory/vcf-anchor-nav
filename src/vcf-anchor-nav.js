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
 * ### Styling
 *
 * The following custom properties are available for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|-------------
 * `--_anchor-nav-inner-max-width` | `max-width` of inner container (`[part="container"]`) | `auto`
 * `--_anchor-nav-inner-background` | `background` of inner container (`[part="container"]`) | `var(--lumo-base-color)` (`#ffffff`)
 * `--_anchor-nav-inner-padding` | `padding` of inner container (`[part="container"]`) | `0 0 20vh 0`
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name | Description
 * ----------------|----------------
 * `container` | Main container for header, tabs and sections.
 * `header` | Wrapper for header slot above tabs.
 * `tabs` | Internal `vaadin-tabs` used for navigation.
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
          --_anchor-nav-inner-max-width: auto;
          --_anchor-nav-inner-background: var(--lumo-base-color);
          --_anchor-nav-inner-padding: 0;
        }

        :host([fullscreen]) {
          height: 100vh;
          position: fixed;
          top: 0;
          bottom: 0;
          right: 0;
          left: 0;
          z-index: 1;
          transition: all 0.2s;
        }

        [part='container'] {
          display: flex;
          flex-direction: column;
          width: 100%;
          margin: auto;
          max-width: var(--_anchor-nav-inner-max-width);
          padding: var(--_anchor-nav-inner-padding);
          background: var(--_anchor-nav-inner-background);
        }

        [part='tabs'] {
          position: sticky;
          top: -1px;
          background: var(--lumo-base-color);
          z-index: 1;
        }

        ::slotted(*) {
          flex: 0 0 auto;
        }

        ::slotted(vcf-anchor-nav-section:nth-child(even)) {
          background: var(--lumo-shade-5pct);
        }

        ::slotted([slot='header']) {
          padding: 0 var(--lumo-space-m);
        }
      </style>
      <div part="container">
        <div id="header" part="header"><slot name="header"></slot></div>
        <vaadin-tabs id="tabs" part="tabs"></vaadin-tabs>
        <slot id="slot"></slot>
      </div>
    `;
  }

  static get is() {
    return 'vcf-anchor-nav';
  }

  static get version() {
    return '0.1.9';
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
      selectedId: String,
      /**
       * Component fills the entire screen.
       * @type {String}
       */
      fullscreen: {
        type: Boolean,
        reflectToAttribute: true,
        observer: '_fullscreenChanged'
      }
    };
  }

  /**
   * Returns array of the section elements.
   * @returns {Array<VcfAnchorNavSection>}
   */
  get sections() {
    return this.$.slot.assignedNodes().filter(node => node.tagName === 'VCF-ANCHOR-NAV-SECTION');
  }

  /**
   * Returns the last section.
   * @returns {VcfAnchorNavSection}
   */
  get last() {
    return this.sections[this.sections.length - 1];
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
        section.id = section.id || section.name.replace(/ /g, '-').toLowerCase();
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
      // Hack to fix initial scroll on Firefox
      setTimeout(() => {
        // Scroll to and select section in URL hash if possible
        if (location.hash) {
          const section = this.querySelector(location.hash);
          if (section) {
            this.scrollTo({ top: section.offsetTop - this.$.tabs.clientHeight });
            this._clearSelection();
            this._setNavItemSelected(location.hash.replace('#', ''), true);
          }
        }
      });
    }
  }

  _initTabHighlight() {
    const callback = (entries, observer) => {
      const lastEntry = entries[entries.length - 1];
      // Threshold comparison required for Firefox
      lastEntry.target.isIntersecting = lastEntry.isIntersecting && lastEntry.intersectionRatio >= observer.thresholds[0];
      this._updateSelected();
    };
    this.sections.forEach((element, i) => {
      const options = {
        root: this,
        threshold: this._getThreshold(element.clientHeight, i)
      };
      const observer = new IntersectionObserver(callback, options);
      observer.observe(element);
    });
  }

  _updateSelected() {
    clearTimeout(this._updateSelectedTimeout);
    this._updateSelectedTimeout = setTimeout(() => {
      this._clearSelection();
      this._thresholds;
      const firstIntersecting = this.sections.filter(i => i.isIntersecting)[0];
      if (firstIntersecting) this._setNavItemSelected(firstIntersecting.id, true);
      else this._setNavItemSelected(this.sections[this.selectedIndex].id, true);
    });
  }

  _getThreshold(sectionHeight, index) {
    // This factor value can be adjusted however
    // Below 0.7 in Firefox the highlighting is inconsistent
    // Above 0.9 all browsers may not work correctly
    const factor = 0.75;
    let height = this.clientHeight - this.$.tabs.clientHeight;
    if (index === 0) height -= this.$.header.clientHeight;
    return sectionHeight > height ? (height / sectionHeight) * factor : 1;
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
    // Horizontal scroll tabs when selected changes
    if (this.$.tabs.hasAttribute('overflow') && this.sections.length) {
      const leftOffset = this.$.tabs.root.querySelector('[part="back-button"]').clientWidth * 2;
      const topOffset = this.sections[0].offsetTop;
      const scrollRatio = (this.sections[selectedIndex].offsetTop - topOffset) / (this.scrollHeight - topOffset);
      const left = this.$.tabs.$.scroll.scrollWidth * scrollRatio;
      this.$.tabs.$.scroll.scrollTo({
        left: left && left - leftOffset,
        behavior: 'smooth'
      });
    }
  }

  _fullscreenChanged(fullscreen) {
    const body = document.querySelector('body');
    if (fullscreen) {
      body.style.overflow = 'hidden';
      setTimeout(() => {
        const windowHeight = window.innerHeight - this.$.tabs.clientHeight;
        const paddingBottom = this.last.clientHeight < windowHeight ? windowHeight - this.last.clientHeight : 0;
        this.style.setProperty('--_anchor-nav-inner-padding', `0 0 ${paddingBottom}px 0`);
      });
    } else {
      body.style.removeProperty('overflow');
      this.style.setProperty('--_anchor-nav-inner-padding', '0');
    }
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
