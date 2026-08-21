import { ElementMixin } from '@vaadin/component-base/src/element-mixin.js';
import { ThemeDetectionMixin } from '@vaadin/vaadin-themable-mixin/vaadin-theme-detection-mixin.js';

import { AnchorNavSectionElement } from './vcf-anchor-nav-section.js';

/**
 * Fired when the slotted `<vcf-anchor-nav-section>` elements are ready.
 */
export type AnchorNavSectionsReadyEvent = CustomEvent<AnchorNavSectionElement[]>;

/**
 * Fired when the selected tab changes.
 */
export type AnchorNavSelectedChangedEvent = CustomEvent<{ index: number; id: string }>;

export interface AnchorNavCustomEventMap {
  'sections-ready': AnchorNavSectionsReadyEvent;

  'selected-changed': AnchorNavSelectedChangedEvent;
}

export interface AnchorNavEventMap extends HTMLElementEventMap, AnchorNavCustomEventMap {}

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
 * `--anchor-nav-header-padding` | `padding` of the slotted "header" content. | `0 1rem`
 * `--anchor-nav-inner-max-width` | `max-width` of the "container" part. | `auto`
 * `--anchor-nav-inner-background` | `background` of the "container" part. | `#ffffff`
 * `--anchor-nav-inner-padding` | `padding` of the "container" part. | `0`
 * `--anchor-nav-tabs-background` | `background` of the slotted "tabs" content. | `#fff`
 * `--anchor-nav-tabs-stuck-box-shadow` | `box-shadow` of slotted "tabs" content when stuck to top of viewport. | `0 4px 5px -6px rgba(0, 0, 0, 0.4)`
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name | Description
 * ----------------|----------------
 * `container` | Main container for header, tabs and sections.
 * `header` | Wrapper for header slot above tabs.
 * `tabs` | Internal `vaadin-tabs` used for navigation.
 *
 * @fires {CustomEvent} sections-ready - Fired when the slotted sections are ready.
 * @fires {CustomEvent} selected-changed - Fired when the selected tab is changed.
 * @mixes ElementMixin
 * @mixes ThemeDetectionMixin
 */
declare class AnchorNavElement extends ThemeDetectionMixin(ElementMixin(HTMLElement)) {
  /**
   * The tag name of this element.
   */
  static readonly is: string;

  /**
   * The version of this component.
   */
  static readonly version: string;

  /**
   * Whether the element is a `<vcf-anchor-nav>`.
   */
  static isSame(el: Element): boolean;

  /**
   * Id of selected section.
   *
   * @attr {string} selected-id
   */
  selectedId: string;

  /**
   * Index of selected section.
   *
   * @attr {number} selected-index
   */
  selectedIndex: number;

  /**
   * Component fills the entire screen.
   *
   * @attr {boolean} fullscreen
   */
  fullscreen: boolean;

  /**
   * Disables preserving of selected tab and scroll position on refresh.
   *
   * @attr {boolean} disable-preserve-on-refresh
   */
  disablePreserveOnRefresh: boolean;

  /**
   * Set true to enable smooth scroll animation on tab clicks.
   *
   * @attr {boolean} smooth-scroll
   */
  smoothScroll: boolean;

  /**
   * Set to true to disable history of internal navigation so that
   * pressing back and forward in the browser only move between
   * views / pages and not navigation sections.
   *
   * @attr {boolean} no-history
   */
  noHistory: boolean;

  /**
   * The slotted section elements.
   */
  readonly sections: AnchorNavSectionElement[];

  /**
   * The slotted header element, or `null` when nothing is slotted into "header".
   */
  readonly header: HTMLElement | null;

  addEventListener<K extends keyof AnchorNavEventMap>(
    type: K,
    listener: (this: AnchorNavElement, ev: AnchorNavEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean
  ): void;

  removeEventListener<K extends keyof AnchorNavEventMap>(
    type: K,
    listener: (this: AnchorNavElement, ev: AnchorNavEventMap[K]) => void,
    options?: EventListenerOptions | boolean
  ): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'vcf-anchor-nav': AnchorNavElement;
  }
}

export { AnchorNavElement };
