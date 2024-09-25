import { html, PolymerElement } from '@polymer/polymer/polymer-element';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';
import { ElementMixin } from '@vaadin/component-base/src/element-mixin';
import { smoothScrollPolyfill } from '../lib/common-js-modules.esm';
import { ResizeObserver } from '@juggle/resize-observer';
import '@vaadin/tabs/vaadin-tabs';
import '@vaadin/tabs/vaadin-tab';

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

        [part='tabs'],
        ::slotted([part='tabs']) {
          position: -webkit-sticky;
          position: sticky;
          top: 0 !important;
          background: var(--lumo-base-color);
          z-index: 2;
        }

        :host([has-header]) [part='tabs'],
        :host([has-header]) ::slotted([part='tabs']) {
          top: -1px !important;
        }

        [part='tabs'][stuck]::after,
        ::slotted([part='tabs'][stuck])::after {
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
          min-height: var(--_expand-last-height);
        }
      </style>
      <div id="container" part="container">
        <div id="header" part="header">
          <slot id="headerSlot" name="header"></slot>
        </div>
        <slot id="tabsSlot" name="tabs">
          <vaadin-tabs id="tabs" part="tabs"></vaadin-tabs>
        </slot>
        <slot id="slot"></slot>
      </div>
    `;
  }

  static get is() {
    return 'vcf-anchor-nav';
  }

  static isSame(el) {
    return el.tagName === `${AnchorNavElement.is}`.toUpperCase();
  }

  static get version() {
    return '23.4.0';
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
       * @type {Boolean}
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
      },

      /**
       * Set true to enable smooth scroll animation on tab clicks.
       * @type {Boolean}
       */
      smoothScroll: {
        type: Boolean,
        value: true
      },
      /**
       * Set to true to disable history of internal navigation so that
       * pressing back and forward in the browser only move between
       * views / pages and not navigation sections
       */
      noHistory: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
        notify: true
      }
    };
  }

  /**
   * Returns array of the slotted section elements.
   * @returns {Array<AnchorNavSectionElement>}
   */
  get sections() {
    const slot = this.shadowRoot && this.shadowRoot.querySelector('#slot');
    return (slot && slot.assignedNodes().filter(node => node.tagName === 'VCF-ANCHOR-NAV-SECTION')) || [];
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

  get _expandLastHeight() {
    return this.clientHeight - this._tabHeight;
  }

  get _deepLinks() {
    return !this.disablePreserveOnRefresh;
  }

  ready() {
    super.ready();
    this._verticalTabs = false;
    // Add polyfill
    smoothScrollPolyfill();
    // Init observers
    this._initTabsStuckAttribute();
    this._initWindowResizeListener();
    this._initContainerResizeObserver();
    // Add slotchange listeners
    this.$.slot.addEventListener('slotchange', () => this._onSlotChange());
    this.$.tabsSlot.addEventListener('slotchange', e => this._onTabsSlotChange(e));
    this.$.headerSlot.addEventListener('slotchange', () => this._onHeaderSlotChange());
    this._toggleNoHistory(this.noHistory);

    // Add popstate listener
    window.addEventListener('popstate', event => {
      this._initTabHighlight();
      this._scrollToHash();
    });
    // Add nav focus listener
    this.addEventListener('focus', e => this._onNavFocus(e), true);
    // Init section focus listener
    this.onSectionFocus = () => {
      this.sections.forEach(section => section.removeAttribute('tabindex'));
    };
    this.addEventListener('no-history-changed', event => {
      this._toggleNoHistory(this.noHistory);
    });
  }

  _toggleNoHistory(noHistory) {
    if (noHistory) {
      this._enableNoHistory();
    } else {
      this._disableNoHistory();
    }
  }

  _disableNoHistory() {
    if (!history.elementsWithNoHistory) {
      return;
    }
    const indexOfCurrent = history.elementsWithNoHistory.indexOf(this);
    if (indexOfCurrent < 0) {
      return;
    }
    history.elementsWithNoHistory.splice(indexOfCurrent, 1);
    if (history.elementsWithNoHistory.length === 0) {
      this._clearOldPushState();
    }
  }

  _enableNoHistory() {
    if (!history.elementsWithNoHistory || history.elementsWithNoHistory.length === 0) {
      history.elementsWithNoHistory = [this];
      history.oldPushState = history.pushState;
      history.currentPathname = window.location.pathname;
      history.pushState = function pushState(state, unused, url) {
        let incomingPathname = null;
        if (typeof url === 'string' || url instanceof String) {
          incomingPathname = url;
        } else if (typeof url === 'object' && !Array.isArray(url) && url !== null) {
          incomingPathname = url.pathname;
        }
        if (incomingPathname != history.currentPathname) {
          history.currentPathname = incomingPathname;
          history.oldPushState(state, unused, url);
        } else {
          history.replaceState('', '');
        }
      };
    } else if (!history.elementsWithNoHistory.includes(this)) {
      history.elementsWithNoHistory.push(this);
    }
  }

  _clearOldPushState() {
    if (history.oldPushState) {
      history.pushState = history.oldPushState;
      history.oldPushState = null;
    }
  }

  disconnectedCallback() {
    this._clearOldPushState();
    this._disableNoHistory();
    super.disconnectedCallback();
  }

  connectedCallback() {
    super.connectedCallback();
    this._toggleNoHistory(this.noHistory);
  }

  _onNavFocus(e) {
    if (AnchorNavElement.isSame(e.target)) {
      this.sections.forEach(section => section.setAttribute('tabindex', '0'));
    }
  }

  _onSlotChange() {
    if (this.sections.length) {
      this.sections.forEach(section => {
        section.id = section.id || section.defaultId;
        // Create default tab
        let tab = section.tab;
        if (!tab) {
          tab = document.createElement('vaadin-tab');
          this.$.tabs.appendChild(tab);
          this._initTab(tab, section);
        }
        section.removeEventListener('section-focus', this.onSectionFocus);
        section.addEventListener('section-focus', this.onSectionFocus);
      });
      this._sortTabs();
      this._initTabHighlight();
      if (this._deepLinks && location.hash) this._scrollToHash();
      else if (this.selectedId && this.selectedIndex !== 0) this._scrollToSection(this.selectedId);
      // Dispatch sections-ready event
      this.dispatchEvent(new CustomEvent('sections-ready', { detail: this.sections }));
      // Set exapnd-last theme height
      this._setExpandLastHeight();
    }
  }

  _setExpandLastHeight() {
    this.style.setProperty('--_expand-last-height', `${this._expandLastHeight}px`);
  }

  _onHeaderSlotChange() {
    if (this.header) this.setAttribute('has-header', true);
    else this.removeAttribute('has-header');
  }

  _onTabsSlotChange(e) {
    const slottedTabsElement = e.target.assignedElements().filter(el => el.tagName.toUpperCase() === 'VAADIN-TABS')[0];
    if (slottedTabsElement) {
      const defaultTabs = Array.from(this.$.tabs.querySelectorAll('vaadin-tab'));
      defaultTabs.forEach(tab => slottedTabsElement.appendChild(tab));
      slottedTabsElement.setAttribute('part', 'tabs');
      this.$.tabs.remove();
      this.$.tabs = slottedTabsElement;
      Array.from(slottedTabsElement.querySelectorAll('vaadin-tab')).forEach(tab => {
        const section = this.querySelector(`[tab-id="${tab.id}"]`);
        if (section) this._initTab(tab, section);
      });
    }
  }

  _getTitle(section) {
    return `${document.title}${document.title ? ` | ${section.name}` : section.name}`;
  }

  _scrollToHash() {
    // rAF required to fix initial scroll on all browsers
    requestAnimationFrame(() => {
      // Scroll to and select section in URL hash if possible
      if (location.hash) {
        const section = this.querySelector(location.hash);
        const top = section ? section.offsetTop - this._tabHeight : 0;
        this.scrollTo({ top });
        if (section) this.selectedId = location.hash.replace('#', '');
      }
    });
  }

  _initTab(tab, section) {
    tab.id = tab.id || section.defaultTabId;
    tab.setAttribute('part', 'tab');
    tab.addEventListener('click', () => this._scrollToSection(section.id, this.smoothScroll, this._deepLinks));
    this._setTabAnchor(tab, section);
  }

  _sortTabs() {
    this.sections.forEach(section => {
      if (section.navTab) this.$.tabs.appendChild(section.navTab);
    });
  }

  _setTabAnchor(tab, section) {
    let a = tab.querySelector('a');
    if (!a) {
      a = document.createElement('a');
      Array.from(tab.childNodes).forEach(node => a.appendChild(node));
      a.id = `${section.id}-anchor`;
      if (!a.innerText) a.innerText = section.name;
      if (this._deepLinks) a.href = section.url.toString();
      a.addEventListener('click', e => e.preventDefault());
      tab.appendChild(a);
      return a;
    }
  }

  _initContainerResizeObserver() {
    let firstResize = true;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this._initTabHighlight();
        this._setExpandLastHeight();
        if (this.selectedId && this.selectedIndex !== 0 && firstResize) {
          const section = this.querySelector(`#${this.selectedId}`);
          if (section) this.scrollTo({ top: section.offsetTop - this._tabHeight });
          firstResize = false;
        }
      });
    });
    observer.observe(this.$.container);
  }

  _initWindowResizeListener() {
    let windowHeight = window.innerHeight;
    let windowResizeTimeout;
    window.addEventListener('resize', () => {
      // Debounce resize event
      clearTimeout(windowResizeTimeout);
      windowResizeTimeout = setTimeout(() => {
        if (windowHeight !== window.innerHeight) {
          this._initTabHighlight();
          this._setExpandLastHeight();
          windowHeight = window.innerHeight;
        }
      }, 300);
    });
  }

  _clearIntersectionObservers() {
    if (this._intersectionObservers) {
      this._intersectionObservers.forEach(o => {
        o.observer.unobserve(o.element);
      });
    }
    this._intersectionObservers = [];
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
    this._clearIntersectionObservers();
    this.sections.forEach((element, i) => {
      if (element.clientHeight) {
        const options = {
          root: this,
          threshold: this._getIntersectionThreshold(element.clientHeight)
        };
        const observer = new IntersectionObserver(callback, options);
        observer.observe(element);
        this._intersectionObservers[i] = { observer, element };
      }
    });
    this._observeIntersections = true;
    this._firstTabSelect = true;
  }

  _initTabsStuckAttribute() {
    requestAnimationFrame(() => {
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
        if (!this.selectedId) this.selectedIndex = this._getSectionIndex(firstIntersecting.id);
        this._firstUpdate = true;
      } else {
        this.selectedIndex = this._getSectionIndex(firstIntersecting.id);
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

  _selectTab(section) {
    this.$.tabs.querySelectorAll('vaadin-tab').forEach(tab => (tab.selected = false));
    const tab = section.tab;
    if (tab) tab.selected = true;
    // Horizontally scroll tabs when selected changes
    if (this.$.tabs.hasAttribute('overflow') && this.sections.length) {
      const leftOffset = this.$.tabs.root.querySelector('[part="back-button"]').clientWidth * 2;
      const topOffset = this.sections[0].offsetTop;
      const scrollRatio = (this.sections[this.selectedIndex].offsetTop - topOffset) / (this.scrollHeight - topOffset);
      const left = this.$.tabs.$.scroll.scrollWidth * scrollRatio;
      this.$.tabs.$.scroll.scrollTo({
        left: left && left - leftOffset,
        behavior: this._firstTabSelect ? 'auto' : 'smooth'
      });
      this._firstTabSelect = false;
    }
    this.dispatchEvent(new CustomEvent('selected-changed', { detail: { index: this.selectedIndex, id: this.selectedId } }));
  }

  _getSectionIndex(sectionId) {
    const section = sectionId && this.querySelector(`#${sectionId}`);
    return section && this.sections.indexOf(section);
  }

  _getSectionId(sectionIndex) {
    return sectionIndex < this.sections.length && this.sections[sectionIndex].id;
  }

  _setSelectedSection(sectionIndex) {
    requestAnimationFrame(() => {
      this.selectedIndex = sectionIndex;
      this._scrollToSection(sectionIndex, false);
    });
  }

  _scrollToSection(sectionIndex, smooth = true, deepLinks = true) {
    let sectionId = this._getSectionId(sectionIndex);
    // Accept both section index or id
    if (typeof sectionIndex === 'string') sectionId = sectionIndex;
    const section = sectionId && this.querySelector(`#${sectionId}`);
    if (section) {
      section.focus({ preventScroll: true });
      section.scrollTop = this.scrollTo({
        top: section.offsetTop - this._tabHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
    if (deepLinks) {
      history.pushState(null, this._getTitle(section), section.url);
    }
  }

  _selectedIdChanged(selectedId) {
    if (selectedId) {
      const selectedIndex = this._getSectionIndex(selectedId);
      if (this.selectedIndex !== selectedIndex) {
        const section = this.querySelector(`#${selectedId}`);
        this._selectTab(section);
        this.selectedIndex = selectedIndex;
      }
    }
  }

  _selectedIndexChanged(selectedIndex) {
    const section = this.sections[selectedIndex];
    if (section && this.selectedId !== section.id) {
      this._selectTab(section);
      if (section.id) this.selectedId = section.id;
    }
  }

  /**
   * Fired when the slotted vcf-anchor-nav-section's are ready.
   *
   * @event sections-ready
   * @param {Object} detail
   * @param {Array<AnchorNavSectionElement>} detail.sections Array of sections.
   */

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
