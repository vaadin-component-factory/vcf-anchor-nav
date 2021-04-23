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
export class AnchorNavElement extends ElementMixin(ThemableMixin(PolymerElement)) {
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
          top: 0 !important;
          background: var(--lumo-base-color);
          z-index: 1;
        }

        :host([has-header]) [part='tabs'] {
          top: -1px !important;
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
          min-height: calc(var(--_height) - var(--_tab-height));
        }
      </style>
      <div id="container" part="container">
        <div id="header" part="header">
          <slot id="headerSlot" name="header"></slot>
        </div>
        <vaadin-tabs id="tabs" part="tabs"></vaadin-tabs>
        <slot id="slot"></slot>
      </div>
    `;
  }

  static get is() {
    return 'vcf-anchor-nav';
  }

  static get version() {
    return '1.2.0-beta.3';
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
   * Returns array of the slotted section elements.
   * @returns {Array<VcfAnchorNavSection>}
   */
  get sections() {
    return this.$.slot.assignedNodes().filter(node => node.tagName === 'VCF-ANCHOR-NAV-SECTION');
  }

  /**
   * Returns the slotted header element.
   * @returns {HTMLElement}
   */
  get header() {
    return this.$.headerSlot.assignedNodes()[0] || null;
  }

  get _tabHeight() {
    return this._verticalTabs ? 0 : this.$.tabs.clientHeight;
  }

  get _deepLinks() {
    return !this.disablePreserveOnRefresh;
  }

  ready() {
    super.ready();
    smoothScrollPolyfill();
    stickyPolyfill.add(this.$.tabs);
    this._initTabsStuckAttribute();
    this._initContainerResizeObserver();
    this.$.headerSlot.addEventListener('slotchange', () => this._onHeaderSlotChange());
    this.$.slot.addEventListener('slotchange', () => this._onSlotChange());
    window.addEventListener('popstate', () => {
      this._initTabHighlight();
      this._scrollToHash();
    });
    this._verticalTabs = false;
    this.style.setProperty('--_tab-height', `${this._tabHeight}px`);
    this.style.setProperty('--_height', `${this.clientHeight}px`);
  }

  _onSlotChange() {
    if (this.sections.length) {
      this.sections.forEach(section => {
        // Create default tab
        let tab = section.tab;
        if (!tab) {
          tab = document.createElement('vaadin-tab');
          this.$.tabs.appendChild(tab);
          this._initTab(tab, section);
        }
      });
      this._initTabHighlight();
      if (this.selectedId) this._scrollToSection(this.selectedId);
      else if (this._deepLinks) this._scrollToHash();
      // Dispatch sections-ready event
      this.dispatchEvent(new CustomEvent('sections-ready', { detail: this.sections }));
    }
  }

  _onHeaderSlotChange() {
    if (this.header) this.setAttribute('has-header', true);
    else this.removeAttribute('has-header');
  }

  _getTitle(section) {
    return `${document.title}${document.title ? ` | ${section.name}` : section.name}`;
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

  _initTab(tab, section) {
    tab.id = tab.id || section.defaultTabId;
    tab.setAttribute('part', 'tab');
    tab.dataset.sectionId = section.id;
    section._setTabAnchor(tab, section.url);
    tab.addEventListener('click', () => {
      this._scrollToSection(section.id);
      if (this._deepLinks) history.pushState(null, this._getTitle(section), section.url);
    });
  }

  _initContainerResizeObserver() {
    let firstResize = true;
    const observer = new ResizeObserver(() => {
      this._initTabHighlight();
      if (this.selectedId && firstResize) {
        const section = this.querySelector(`#${this.selectedId}`);
        if (section) this.scrollTo({ top: section.offsetTop - this._tabHeight });
        firstResize = false;
      }
    });
    observer.observe(this.$.container);
  }

  _initTabHighlight() {
    const callback = (entries, observer) => {
      if (this._observeIntersections) {
        const lastEntry = entries[entries.length - 1];
        // Threshold comparison required for Firefox
        lastEntry.target.isIntersecting = lastEntry.isIntersecting && lastEntry.intersectionRatio >= observer.thresholds[0];
        this._updateSelected();
      }
    };
    this.sections.forEach((element, i) => {
      if (element.clientHeight) {
        const options = {
          root: this,
          threshold: this._getIntersectionThreshold(element.clientHeight)
        };
        const observer = new IntersectionObserver(callback, options);
        observer.observe(element);
      }
    });
    this._observeIntersections = true;
  }

  _initTabsStuckAttribute() {
    setTimeout(() => {
      const observer = new IntersectionObserver(
        ([e]) => {
          e.target.toggleAttribute('stuck', !this.hasAttribute('has-header') || e.intersectionRatio < 1);
        },
        {
          root: this,
          threshold: 1
        }
      );
      observer.observe(this.$.tabs);
    });
  }

  _updateSelected() {
    const firstIntersecting = this.sections.filter(i => i.isIntersecting)[0];
    if (firstIntersecting) {
      if (!this._firstUpdate) {
        // Prevent overwriting selected index on first update
        if (!this.selectedId && !this.selectedIndex) this.selectedIndex = this._getTabIndex(firstIntersecting.id);
        this._firstUpdate = true;
      } else {
        this.selectedIndex = this._getTabIndex(firstIntersecting.id);
      }
    }
  }

  _getIntersectionThreshold(sectionHeight) {
    // This factor value can be adjusted, however
    // - below 0.7 in Firefox intersecting events are inconsistent
    // - above 0.9 all browsers intersecting events may not work as expected
    const factor = 0.75;
    const height = this.clientHeight - this._tabHeight;
    return height > 0 && sectionHeight >= height ? (height / sectionHeight) * factor : 1;
  }

  _selectTab(sectionId) {
    this.$.tabs.querySelectorAll('vaadin-tab').forEach(tab => (tab.selected = false));
    const tab = this._getSectionTab(sectionId);
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
    let tab = this._getSectionTab(sectionId);
    let i = 0;
    if (tab) while ((tab = tab.previousSibling) !== null) i++;
    else i = this.selectedIndex;
    return i;
  }

  _getSectionId(sectionIndex) {
    return this.sections[sectionIndex].id;
  }

  _getSectionTab(sectionId) {
    const section = sectionId && this.querySelector(`#${sectionId}`);
    return section && section.tab;
  }

  _scrollToSection(sectionId) {
    // Accept both section id or index
    if (typeof sectionId === 'number') sectionId = this._getSectionId(sectionId);
    const section = sectionId && this.querySelector(`#${sectionId}`);
    if (section) {
      section.focus({ preventScroll: true });
      section.scrollTop = this.scrollTo({
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
    const selectedId = this._getSectionId(selectedIndex);
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

customElements.define(AnchorNavElement.is, AnchorNavElement);

/**
 * @namespace Vaadin
 */
window.Vaadin.AnchorNavElement = AnchorNavElement;
