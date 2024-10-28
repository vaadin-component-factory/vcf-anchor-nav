import '@polymer/iron-demo-helpers/demo-pages-shared-styles';
import '@polymer/iron-demo-helpers/demo-snippet';
import '@vaadin/button';
import '@vaadin/text-field';
import '@vaadin/vaadin-lumo-styles/icons';
import '@vaadin/vaadin-lumo-styles/typography';
import '../vcf-anchor-nav';
import './demo-icons';

window.addEventListener('WebComponentsReady', () => {
  setTimeout(() => document.querySelector('body').style.removeProperty('overflow'));
  const mainCodeContainerStyles = document.querySelector('#codeContainerStyles');
  document.querySelectorAll('.hidden').forEach(element => element.classList.remove('hidden'));
  document.querySelectorAll('demo-snippet').forEach(element => {
    const codeContainer = element.shadowRoot.querySelector('.code-container');
    const code = codeContainer.querySelector('#code');
    const copyButton = codeContainer.querySelector('#copyButton');
    if (window.innerWidth > 768) {
      const codeContainerStyles = document.createElement('style');
      const copyVaadinButton = document.createElement('vaadin-button');
      const copyIcon = document.createElement('vaadin-icon');
      // Custom <demo-snippet> styles
      element.shadowRoot.appendChild(codeContainerStyles);
      codeContainerStyles.innerHTML = mainCodeContainerStyles.innerHTML;
      // Custom <demo-snippet> Copy <vaadin-button>
      copyVaadinButton.id = 'copyVaadinButton';
      copyVaadinButton.setAttribute('theme', 'icon');
      copyVaadinButton.setAttribute('title', 'Copy to clipboard');
      copyVaadinButton.appendChild(copyIcon);
      copyVaadinButton.addEventListener('click', () => {
        document
          .querySelectorAll('demo-snippet')
          .forEach(element => element.shadowRoot.querySelector('vaadin-icon').setAttribute('icon', 'vcf-demo:copy'));
        copyButton.click();
        copyIcon.setAttribute('icon', 'lumo:checkmark');
      });
      copyIcon.setAttribute('icon', 'vcf-demo:copy');
      codeContainer.appendChild(copyVaadinButton);
    } else {
      code.innerHTML = 'View demo code on a larger screen';
      copyButton.style.display = 'none';
    }
  });
});
