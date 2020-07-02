import '@polymer/iron-demo-helpers/demo-pages-shared-styles';
import '@polymer/iron-demo-helpers/demo-snippet';
import '@vaadin/vaadin-button';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-lumo-styles/icons';
import '@vaadin/vaadin-lumo-styles/typography';
import '../theme/lumo/vcf-anchor-nav';
import './demo-icons';

window.addEventListener('WebComponentsReady', () => {
  setTimeout(() => document.querySelector('body').style.removeProperty('overflow'));
  const demoSnippetCSS = document.querySelector('#demoSnippetStyles').innerHTML;
  document.querySelectorAll('.hidden').forEach(element => element.classList.remove('hidden'));
  document.querySelectorAll('demo-snippet').forEach(element => {
    const codeContainer = element.shadowRoot.querySelector('.code-container');
    const demoSnippetStyles = document.createElement('style');
    const copyButton = codeContainer.querySelector('#copyButton');
    const copyVaadinButton = document.createElement('vaadin-button');
    const copyIcon = document.createElement('iron-icon');
    // Copy <vaadin-button>
    codeContainer.appendChild(copyVaadinButton);
    copyVaadinButton.id = 'copyVaadinButton';
    copyVaadinButton.setAttribute('theme', 'icon');
    copyVaadinButton.setAttribute('title', 'Copy to clipboard');
    copyVaadinButton.appendChild(copyIcon);
    copyVaadinButton.addEventListener('click', () => {
      document
        .querySelectorAll('demo-snippet')
        .forEach(element => element.shadowRoot.querySelector('iron-icon').setAttribute('icon', 'vcf-demo:copy'));
      copyButton.click();
      copyIcon.setAttribute('icon', 'lumo:checkmark');
    });
    copyIcon.setAttribute('icon', 'vcf-demo:copy');
    element.shadowRoot.appendChild(demoSnippetStyles);
    // Custom demo snippet styles
    demoSnippetStyles.innerHTML = demoSnippetCSS;
  });
});
