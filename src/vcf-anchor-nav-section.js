import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';
import { ElementMixin } from '@vaadin/vaadin-element-mixin';

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
class VcfAnchorNavSection extends ElementMixin(ThemableMixin(PolymerElement)) {
  static get is() {
    return 'vcf-anchor-nav-section';
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
      }
    };
  }

  constructor() {
    super();
    this.name = this.name || `Section ${this.sectionNumber}`;
  }

  ready() {
    super.ready();
    this.setAttribute('tabindex', '-1');
    this.$.tabSlot.addEventListener('slotchange', e => this._onTabSlotChange(e));
  }

  get nav() {
    return this.parentElement.tagName === 'VCF-ANCHOR-NAV' ? this.parentElement : null;
  }

  get tab() {
    if (this.nav) {
      // Get slotted tab
      let tab = this.$.tabSlot.assignedElements()[0];
      // Otherwise get container tab
      if (!tab) tab = this.nav.$.tabs.querySelector(`#${this._customTabId || this.defaultTabId}`);
      return tab;
    }
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

  get sectionNumber() {
    if (this.nav) {
      const sections = Array.from(this.nav.querySelectorAll(VcfAnchorNavSection.is));
      let i = 0;
      if (sections.length) while (sections[i] !== this) i++;
      return i + 1;
    }
  }

  get defaultId() {
    return this.name
      .replace(/[^a-zA-Z0-9- ]/g, '')
      .replace(/ /g, '-')
      .toLowerCase();
  }

  _onTabSlotChange() {
    const tab = this.$.tabSlot.assignedElements()[0];
    if (this.nav && tab) {
      tab.removeAttribute('slot');
      this._customTabId = tab.id;
      this.nav.$.tabs.appendChild(tab);
      this.nav._initTab(tab, this);
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

  _setTabAnchor(tab, url) {
    let a = tab.querySelector('a');
    if (!a && this.nav) {
      const btn = document.createElement('vaadin-button');
      btn.setAttribute('theme', 'tertiary');
      btn.innerText = tab.innerText || this.name;
      Array.from(tab.children).forEach(el => btn.appendChild(el));
      a = document.createElement('a');
      a.id = `${this.id}-anchor`;
      tab.innerText = '';
      if (this.nav._deepLinks) a.href = url.toString();
      a.addEventListener('click', e => e.preventDefault());
      a.appendChild(btn);
      tab.appendChild(a);
      return a;
    }
  }

  _setDefaultId() {
    if (!this.id && this.name) this.id = this.defaultId;
  }
}

customElements.define(VcfAnchorNavSection.is, VcfAnchorNavSection);
