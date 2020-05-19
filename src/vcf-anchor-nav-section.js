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

  static get properties() {
    return {
      /**
       * Used to set corresponding tab label and default header text.
       * If not set defaults to "Section <index>".
       * @type {String}
       */
      name: {
        type: String
      }
    };
  }

  static get template() {
    return html`
      <style>
        :host {
          display: block;
          height: 50vh;
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
      <div id="content" paer="content">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define(VcfAnchorNavSection.is, VcfAnchorNavSection);
