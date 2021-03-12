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

        #default-header,
        ::slotted([slot='header']) {
          margin: 0;
          padding: var(--lumo-space-m);
        }

        #content {
          padding: var(--lumo-space-m);
        }
      </style>
      <div id="header" part="header">
        <slot name="header">
          <h2 id="default-header">[[name]]</h2>
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

  ready() {
    super.ready();
    this.setAttribute('tabindex', '-1');
  }

  get _tab() {
    const tabs = this.parentElement.shadowRoot.querySelector('[part="tabs"]');
    return tabs.querySelector(`#${this.id}-tab`);
  }

  _nameChanged(name) {
    const tab = this._tab;
    if (tab) {
      const a = tab.querySelector('a');
      a.innerText = name;
    }
  }
}

customElements.define(VcfAnchorNavSection.is, VcfAnchorNavSection);
