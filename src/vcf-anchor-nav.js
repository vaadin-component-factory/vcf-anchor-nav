import { html, PolymerElement } from '@polymer/polymer/polymer-element';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';
import { ElementMixin } from '@vaadin/vaadin-element-mixin';
import { smoothScrollPolyfill, stickyPolyfill } from '../lib/common-js-modules.esm';
import { ResizeObserver } from '@juggle/resize-observer';
import '@vaadin/vaadin-tabs/vaadin-tabs';
import '@vaadin/vaadin-tabs/vaadin-tab';

/**
 * `<vcf-anchor-nav>`
 * Web Component for easily creating layouts with sticky anchor navigation tabs and content sections.
 *
 * - Automates the linking of tabs and sections.
 * - Smooth scrolls to section on tab click and sets the URL hash.
 * - Scrolls to URL hash on load (preserve selected tab on refresh).
 *
 * ```html
 * <vcf-anchor-nav>
 *   <h1 slot="header">Header</h1>
 *   <vcf-anchor-nav-section name="One"> ... </vcf-anchor-nav-section>
 *   <vcf-anchor-nav-section name="Two"> ... </vcf-anchor-nav-section>
 *   <vcf-anchor-nav-section name="Three"> ... </vcf-anchor-nav-section>
 * </vcf-anchor-nav>
 * ```
 *
 * ### Styling
 *
 * The following custom properties are available for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|-------------
 * `--anchor-nav-inner-max-width` | `max-width` of "container" part. | `auto`
 * `--anchor-nav-inner-background` | `background` of "container" part. | `#ffffff`
 * `--anchor-nav-inner-padding` | `padding` of "container" part. | `0 0 20vh 0`
 * `--anchor-nav-tabs-stuck-box-shadow` | `box-shadow` of "tabs" part when stuck to top of viewport. | `0 4px 5px -6px rgba(0, 0, 0, 0.4)`
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
          width: 100%;
          height: 100%;
          max-height: 100vh;
          --anchor-nav-inner-max-width: auto;
          --anchor-nav-inner-background: var(--lumo-base-color);
          --anchor-nav-inner-padding: 0;
          --anchor-nav-tabs-stuck-box-shadow: 0 4px 5px -6px rgba(0, 0, 0, 0.4);
          /* 
           * Chrome scrollbar z-index bugfix
           * https://github.com/PolymerElements/iron-list/issues/137#issuecomment-176457768
           */
          will-change: transform;
          -webkit-overflow-scrolling: touch;
        }

        :host([fullscreen]) {
          height: 100vh !important;
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
          max-width: var(--anchor-nav-inner-max-width);
          padding: var(--anchor-nav-inner-padding);
          background: var(--anchor-nav-inner-background);
        }

        [part='tabs'] {
          position: -webkit-sticky;
          position: sticky;
          top: -1px !important;
          background: var(--lumo-base-color);
          z-index: 1;
        }

        [part='tabs'][stuck]::after {
          content: ' ';
          position: absolute;
          width: 100%;
          height: 100%;
          box-shadow: var(--anchor-nav-tabs-stuck-box-shadow);
          z-index: -1;
        }

        ::slotted(*) {
          flex: 0 0 auto;
        }

        ::slotted([slot='header']) {
          padding: 0 var(--lumo-space-m);
        }

        :host([theme~='expand-last']) ::slotted(vcf-anchor-nav-section:last-of-type) {
          min-height: calc(100vh - var(--lumo-size-l));
        }
      </style>
      <div id="container" part="container">
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
    return '1.0.16';
  }

  static get properties() {
    return {
      /**
       * Id of selected section.
       * @type {String}
       */
      selectedId: {
        type: String,
        observer: '_selectedIdChanged'
      },

      /**
       * Index of selected section.
       * @type {Number}
       */
      selectedIndex: {
        type: Number,
        value: 0,
        observer: '_selectedIndexChanged'
      },

      /**
       * Component fills the entire screen.
       * @type {String}
       */
      fullscreen: {
        type: Boolean,
        reflectToAttribute: true
      },

      /**
       * Disables preserving of selected tab and scroll position on refresh.
       * @type {Boolean}
       */
      disablePreserveOnRefresh: {
        type: Boolean,
        value: false
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

  get _tabHeight() {
    return this._verticalTabs ? 0 : this.$.tabs.clientHeight;
  }

  ready() {
    super.ready();
    smoothScrollPolyfill();
    stickyPolyfill.add(this.$.tabs);
    this._initTabsStuckAttribute();
    this._initContainerResizeObserver();
    this.$.slot.addEventListener('slotchange', () => this._onSlotChange());
    window.addEventListener('popstate', () => {
      this._initTabHighlight();
      this._scrollToHash();
    });
    this._verticalTabs = false;
  }

  _onSlotChange() {
    this.$.tabs.innerHTML = '';
    if (this.sections.length) {
      this.sections.forEach((section, i) => {
        const path = this._getAnchorHref();
        const tab = document.createElement('vaadin-tab');
        const a = document.createElement('a');
        section.name = section.name || `Section ${i + 1}`;
        section.id =
          section.id ||
          section.name
            .replace(/[^a-zA-Z0-9- ]/g, '')
            .replace(/ /g, '-')
            .toLowerCase();
        a.innerText = section.name;
        a.id = `${section.id}-anchor`;
        a.href = `${path}#${section.id}`;
        a.addEventListener('click', e => e.preventDefault());
        tab.id = `${section.id}-tab`;
        tab.appendChild(a);
        tab.addEventListener('click', () => {
          this._scrollToSection(section.id);
          history.pushState(null, null, `${path}#${section.id}`);
        });
        this.$.tabs.appendChild(tab);
      });
      this._initTabHighlight();
      if (!this.disablePreserveOnRefresh) this._scrollToHash();
    }
  }

  _getAnchorHref() {
    const end = location.pathname.length - 1;
    return location.pathname[end] === '/' ? location.pathname : location.pathname + '/';
  }

  _scrollToHash() {
    // Hack to fix initial scroll on Firefox
    setTimeout(() => {
      // Scroll to and select section in URL hash if possible
      const section = location.hash && this.querySelector(location.hash);
      const top = section ? section.offsetTop - this._tabHeight : 0;
      this.scrollTo({ top });
      if (section) this.selectedId = location.hash.replace('#', '');
    });
  }

  _initContainerResizeObserver() {
    let firstResize = true;
    const observer = new ResizeObserver(() => {
      this._initTabHighlight();
      if (this.selectedId && firstResize) {
        this.scrollTo({ top: this.querySelector(`#${this.selectedId}`).offsetTop - this._tabHeight });
        firstResize = false;
      }
    });
    observer.observe(this.$.container);
  }

  _initTabHighlight() {
    const callback = (entries, observer) => {
      const lastEntry = entries[entries.length - 1];
      // Threshold comparison required for Firefox
      lastEntry.target.isIntersecting = lastEntry.isIntersecting && lastEntry.intersectionRatio >= observer.thresholds[0];
      this._updateSelected();
    };
    this.sections.forEach((element, i) => {
      if (element.clientHeight) {
        const options = {
          root: this,
          threshold: this._getIntersectionThreshold(element.clientHeight, i)
        };
        const observer = new IntersectionObserver(callback, options);
        observer.observe(element);
      }
    });
  }

  _initTabsStuckAttribute() {
    setTimeout(() => {
      const observer = new IntersectionObserver(([e]) => e.target.toggleAttribute('stuck', e.intersectionRatio < 1), {
        root: this,
        threshold: 1
      });
      observer.observe(this.$.tabs);
    });
  }

  _updateSelected() {
    const firstIntersecting = this.sections.filter(i => i.isIntersecting)[0];
    if (firstIntersecting) this.selectedIndex = this._getTabIndex(firstIntersecting.id);
  }

  _getIntersectionThreshold(sectionHeight, index) {
    // This factor value can be adjusted, however
    // - below 0.7 in Firefox intersecting events are inconsistent
    // - above 0.9 all browsers intersecting events may not work as expected
    const factor = 0.75;
    let height = this.clientHeight - this._tabHeight;
    if (index === 0) height -= this.$.header.clientHeight;
    return sectionHeight >= height ? (height / sectionHeight) * factor : 1;
  }

  _selectTab(sectionId) {
    this.$.tabs.querySelectorAll('vaadin-tab').forEach(tab => (tab.selected = false));
    const tab = this.$.tabs.querySelector(`#${sectionId}-tab`);
    if (tab) tab.selected = true;
    // Horizontally scroll tabs when selected changes
    if (this.$.tabs.hasAttribute('overflow') && this.sections.length) {
      const leftOffset = this.$.tabs.root.querySelector('[part="back-button"]').clientWidth * 2;
      const topOffset = this.sections[0].offsetTop;
      const scrollRatio = (this.sections[this.selectedIndex].offsetTop - topOffset) / (this.scrollHeight - topOffset);
      const left = this.$.tabs.$.scroll.scrollWidth * scrollRatio;
      this.$.tabs.$.scroll.scrollTo({
        left: left && left - leftOffset,
        behavior: 'smooth'
      });
    }
    this.dispatchEvent(new CustomEvent('selected-changed', { detail: { index: this.selectedIndex, id: this.selectedId } }));
  }

  _getTabIndex(sectionId) {
    let tab = sectionId && this.$.tabs.querySelector(`#${sectionId}-tab`);
    let i = 0;
    if (tab) while ((tab = tab.previousSibling) !== null) i++;
    else i = this.selectedIndex;
    return i;
  }

  _scrollToSection(sectionId) {
    const section = sectionId && this.querySelector(`#${sectionId}`);
    if (section) {
      this.scrollTo({
        top: section.offsetTop - this._tabHeight,
        behavior: 'smooth'
      });
    }
  }

  _selectedIdChanged(selectedId) {
    const selectedIndex = this._getTabIndex(selectedId);
    if (this.selectedIndex !== selectedIndex) {
      this._selectTab(selectedId);
      this.selectedIndex = selectedIndex;
    }
  }

  _selectedIndexChanged(selectedIndex) {
    const tab = this.$.tabs.querySelectorAll('vaadin-tab')[selectedIndex] || '';
    const selectedId = tab && tab.id.substring(0, tab.id.length - 4);
    if (this.selectedId !== selectedId) {
      this._selectTab(selectedId);
      this.selectedId = selectedId;
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
