import { assert } from '@open-wc/testing';
import { AnchorNavElement, AnchorNavSectionElement } from '../vcf-anchor-nav.js';

// The package entry point is the only thing a consumer can rely on, so the
// classes it hands out must be the very ones in the custom element registry.
//
// Bug: the section class was neither exported nor put on `window.Vaadin`, which
// left `customElements.get('vcf-anchor-nav-section')` as the only way to reach
// it - so consumers could not name the type, extend the class or check
// `instanceof` without going through the registry.
describe('vcf-anchor-nav public exports', () => {
  it('exports both element classes by name', () => {
    assert.isFunction(AnchorNavElement, 'AnchorNavElement is exported');
    assert.isFunction(AnchorNavSectionElement, 'AnchorNavSectionElement is exported');
    assert.equal(AnchorNavElement.is, 'vcf-anchor-nav');
    assert.equal(AnchorNavSectionElement.is, 'vcf-anchor-nav-section');
  });

  it('exports the classes that are actually registered', () => {
    assert.equal(customElements.get('vcf-anchor-nav'), AnchorNavElement);
    assert.equal(customElements.get('vcf-anchor-nav-section'), AnchorNavSectionElement);
  });

  it('exposes both classes on window.Vaadin', () => {
    assert.equal(window.Vaadin.AnchorNavElement, AnchorNavElement);
    assert.equal(window.Vaadin.AnchorNavSectionElement, AnchorNavSectionElement);
  });

  it('creates instances of the exported classes', () => {
    assert.instanceOf(document.createElement('vcf-anchor-nav'), AnchorNavElement);
    assert.instanceOf(document.createElement('vcf-anchor-nav-section'), AnchorNavSectionElement);
  });
});
