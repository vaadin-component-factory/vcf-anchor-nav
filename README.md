# &lt;vcf-anchor-nav&gt;

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vaadin/web-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![npm version](https://badgen.net/npm/v/@vaadin-component-factory/vcf-anchor-nav)](https://www.npmjs.com/package/@vaadin-component-factory/vcf-anchor-nav)
[![Published on Vaadin Directory](https://img.shields.io/badge/Vaadin%20Directory-published-00b4f0.svg)](https://vaadin.com/directory/component/vaadin-component-factoryvcf-anchor-nav)

Web Component for easily creating layouts with sticky anchor navigation tabs and content sections.

- Automates the linking of tabs and sections.
- Smooth scrolls to section on tab click and sets the URL hash.
- Scrolls to URL hash on load (preserve selected tab on refresh).

![GIF for Vaadin Component Factory anchor nav](https://user-images.githubusercontent.com/3392815/86610834-8be1b700-bfb6-11ea-8009-59fe01c75c28.gif)

## Important information about versioning
**Component versions 23.x were deprecated in order to follow Semanting Versioning practices. Please use latest version 2.x for Vaadin 23+ and version 3.x for Vaadin 24.5.**  

## Compatibility

- Version 1.x.x -> Vaadin 14+
- Version 2.x.x -> Vaadin 23+
- Version 3.x.x -> Vaadin 24.5.x (improved accessibility)

## Installation

Install `vcf-anchor-nav`:

```sh
npm i @vaadin-component-factory/vcf-anchor-nav --save
```

## Usage

Once installed, import it in your application:

```js
import '@vaadin-component-factory/vcf-anchor-nav';
```

Add `<vcf-anchor-nav>` element and `<vcf-anchor-nav-section>`s to the page.

```html
<vcf-anchor-nav>
  <h1 slot="header">Header</h1>
  <vcf-anchor-nav-section name="One"> ... </vcf-anchor-nav-section>
  <vcf-anchor-nav-section name="Two"> ... </vcf-anchor-nav-section>
  <vcf-anchor-nav-section name="Three"> ... </vcf-anchor-nav-section>
</vcf-anchor-nav>
```

## Running demo

1. Fork the `vcf-anchor-nav` repository and clone it locally.

1. Make sure you have [npm](https://www.npmjs.com/) installed.

1. When in the `vcf-anchor-nav` directory, run `npm install` to install dependencies.

1. Run `npm start` to open the demo.

## Server-side API

This is the client-side (Polymer 3) web component. If you are looking for the server-side (Java) API for the Vaadin Platform, it can be found here: [Anchor Nav](https://vaadin.com/directory/component/anchor-nav-for-flow)

## License

Apache License 2.0
