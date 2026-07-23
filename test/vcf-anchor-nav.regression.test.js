import { fixture, html, assert, oneEvent, nextFrame } from '@open-wc/testing';
import '../vcf-anchor-nav.js';

// Regression tests for the too-generic tab selector.
//
// Bug: `_selectTab` located the tab bar with `this.querySelector('vaadin-tabs')`
// and deselected via `querySelectorAll('vaadin-tab')`. Because the nav's own tab
// bar is appended to the light DOM *after* the sections, a `vaadin-tabs` rendered
// inside a section's content came first in tree order and got matched instead —
// so selecting a nav section deselected every tab inside that nested component.
describe('vcf-anchor-nav tab selector scoping', () => {
  let nav;

  // Resolve once the nav has built its tab bar for the slotted sections.
  // Queries the DOM directly (not the `_tabs` getter) so setup works
  // regardless of the fix being present.
  async function whenReady(el) {
    const ownTabs = () => el.querySelector(':scope > vaadin-tabs[slot="tabs"]');
    if (!(ownTabs() && ownTabs().querySelector(':scope > vaadin-tab'))) {
      await oneEvent(el, 'sections-ready');
    }
    await nextFrame();
  }

  beforeEach(async () => {
    nav = await fixture(html`
      <vcf-anchor-nav>
        <vcf-anchor-nav-section name="One">Section one content</vcf-anchor-nav-section>
        <vcf-anchor-nav-section name="Two">
          <vaadin-tabs class="nested-tabs">
            <vaadin-tab>Eins</vaadin-tab>
            <vaadin-tab>Zwei</vaadin-tab>
            <vaadin-tab>Drei</vaadin-tab>
          </vaadin-tabs>
        </vcf-anchor-nav-section>
        <vcf-anchor-nav-section name="Three">Section three content</vcf-anchor-nav-section>
      </vcf-anchor-nav>
    `);
    await whenReady(nav);
  });

  it("_tabs resolves to the nav's own tab bar, not a nested one", () => {
    const tabs = nav._tabs;
    assert.exists(tabs, '_tabs should resolve');
    assert.equal(tabs.parentElement, nav, '_tabs must be a direct child of the nav');
    assert.equal(tabs.getAttribute('slot'), 'tabs', '_tabs must be the slot="tabs" element');
    assert.notEqual(tabs, nav.querySelector('.nested-tabs'), '_tabs must not be a section-nested vaadin-tabs');
  });

  it('selecting a section does not deselect tabs nested inside section content', () => {
    const nestedTabs = nav.querySelector('.nested-tabs');
    const nestedTab = nestedTabs.querySelector('vaadin-tab');
    nestedTab.selected = true;
    assert.isTrue(nestedTab.selected, 'precondition: nested tab is selected');
    assert.equal(nestedTabs.selected, 0, 'precondition: nested tabs index is 0');

    // Select the section that contains the nested tabs.
    nav._selectTab(nav.sections[1]);

    assert.isTrue(nestedTab.selected, 'tab inside section content must remain selected');
    assert.equal(nestedTabs.selected, 0, 'nested vaadin-tabs selected index must be unchanged');
  });

  it("selecting a section selects exactly one of the nav's own tabs", () => {
    nav._selectTab(nav.sections[1]);

    const navTabs = Array.from(nav._tabs.querySelectorAll(':scope > vaadin-tab'));
    const selected = navTabs.filter(tab => tab.selected);
    assert.equal(selected.length, 1, 'exactly one nav tab is selected');
    assert.equal(selected[0], nav.sections[1].tab, 'the selected nav tab is the one for the chosen section');
  });
});
