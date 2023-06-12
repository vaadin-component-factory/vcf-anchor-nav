import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';
import { ElementMixin } from '@vaadin/component-base/src/element-mixin';

/**
 * `<vcf-anchor-nav-section>`
 * Section element used inside `vcf-anchor-nav`.
 *
 * ```html
 * <vcf-anchor-nav-section name="Section 1"></vcf-anchor-nav-section>
 * ```
 *
 * ### Styling
 *
 * The following custom properties are available for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|-------------
 * `--anchor-nav-section-border-width` | `border-width` of section. | `0`
 * `--anchor-nav-section-border-color` | `border-color` of section. | `var(--lumo-contrast-10pct)`
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name | Description
 * ----------------|----------------
 * `header` | Header section.
 * `content` | Content section.
 *
 * @memberof Vaadin
 * @mixes ElementMixin
 * @mixes ThemableMixin
 * @demo demo/index.html
 */
class AnchorNavSectionElement extends ElementMixin(ThemableMixin(PolymerElement)) {
  static get is() {
    return 'vcf-anchor-nav-section';
  }

  static isSame(el) {
    return el.tagName === `${AnchorNavSectionElement.is}`.toUpperCase();
  }

  static get template() {
    return html`
      <style>
        :host {
          --anchor-nav-section-border-width: 0;
          --anchor-nav-section-border-color: var(--lumo-contrast-10pct);
          outline: none;
        }

        :host(:not(:last-of-type)) {
          border-bottom: var(--anchor-nav-section-border-width) solid var(--anchor-nav-section-border-color);
        }

        #defaultHeader,
        ::slotted([slot='header']) {
          margin: 0;
          padding: var(--lumo-space-m);
        }

        #content {
          padding: var(--lumo-space-m);
        }
      </style>
      <slot id="tabSlot" name="tab"></slot>
      <div id="header" part="header">
        <slot name="header">
          <h2 id="defaultHeader">[[name]]</h2>
        </slot>
      </div>
      <div id="content" part="content">
        <slot></slot>
      </div>
    `;
  }

  static get properties() {
    return {
      /**
       * Used to set corresponding tab label and default header text.
       * If not set defaults to "Section <index>".
       * @type {String}
       */
      name: {
        type: String,
        observer: '_nameChanged'
      },
      /**
       * Id of corresponding tab element.
       * @type {String}
       */
      tabId: {
        type: String,
        reflectToAttribute: true
      }
    };
  }

  constructor() {
    super();
    this.name = this.name || this.defaultName;
  }

  ready() {
    super.ready();
    this.setAttribute('tabindex', '-1');
    this.$.tabSlot.addEventListener('slotchange', e => this._onTabSlotChange(e));
    this.addEventListener('focus', e => {
      if (AnchorNavSectionElement.isSame(e.target)) {
        this.dispatchEvent(new CustomEvent('section-focus'));
      }
    });
  }

  get nav() {
    return this.parentElement && (this.parentElement.tagName === 'VCF-ANCHOR-NAV' ? this.parentElement : null);
  }

  get navSections() {
    return this.nav && Array.from(this.nav.querySelectorAll(AnchorNavSectionElement.is));
  }

  get tab() {
    if (this.nav) {
      // Get slotted tab
      let tab = this.slottedTab;
      // Otherwise get container tab
      if (!tab) tab = this.navTab;
      return tab;
    }
  }

  get slottedTab() {
    const tabSlot = this.shadowRoot && this.shadowRoot.querySelector('#tabSlot');
    return tabSlot && tabSlot.assignedElements()[0];
  }

  get navTab() {
    return this.nav && this.nav.$ && this.nav.$.tabs && this.nav.$.tabs.querySelector(`#${this.tabId || this.defaultTabId}`);
  }

  get url() {
    const url = new URL(location);
    url.hash = `#${this.id}`;
    return url;
  }

  get defaultTabId() {
    this._setDefaultId();
    return `${this.id}-tab`;
  }

  get sectionIndex() {
    let i = null;
    if (this.navSections) {
      i = 0;
      if (this.navSections.length) {
        while (this.navSections[i] !== this) i++;
      }
    }
    return i;
  }

  get defaultName() {
    return `Section${this.sectionIndex !== null ? ` ${this.sectionIndex + 1}` : ''}`;
  }

  get defaultId() {
    return this.defaultName
      .replace(/[^a-zA-Z0-9- ]/g, '')
      .replace(/ /g, '-')
      .toLowerCase();
  }

  _onTabSlotChange() {
    const tab = this.tab;
    if (this.nav && this.nav.$ && tab) {
      tab.removeAttribute('slot');
      this.tabId = tab.id;
      this.nav.$.tabs.appendChild(tab);
      this.nav._initTab(tab, this);
      this.nav._sortTabs();
    }
  }

  _nameChanged(name) {
    // Set default tab
    this._setDefaultId();
    const tab = this.tab;
    if (tab && tab.id === this.defaultTabId) {
      let a = tab.querySelector('a');
      if (!a) {
        const url = new URL(location);
        url.hash = `#${this.id}`;
        a = this._setTabAnchor(tab, url);
      }
      a.innerText = name;
    }
  }

  _setDefaultId() {
    if (!this.id) this.id = this.defaultId;
  }
}

customElements.define(AnchorNavSectionElement.is, AnchorNavSectionElement);
