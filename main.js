/* eslint-disable no-prototype-builtins */
'use strict';

const { Liquid } = require('liquidjs');
const fs = require('fs');
const path = require('path');

const templateCache = {};

const validContent = {
  html: 'index.html',
  js: 'index.js',
  examplejs: 'example.js',
  examplehtml: 'example.html',
  css: 'style.css'
};

const defaultTabs = [
  {
    name: 'run',
  },
  {
    name: 'html',
    text: 'HTML'
  },
  {
    name: 'css',
    text: 'CSS'
  },
  {
    name: 'js',
    text: 'JS'
  }
];

const loadDemoResource = (catalog, ctx, filePath) => {
  const demoCss = catalog.resolveResource(`live-demos/${filePath}`, ctx, 'example', [ 'example' ]);
  return demoCss ? demoCss.contents.toString() : undefined;
};

const loadTemplate = (engine, catalog, ctx, filePath) => {
  const key = `${ctx.component}/${ctx.version}/modules/${ctx.module}/examples/${filePath}`;
  if (templateCache.hasOwnProperty(key)) {
    return templateCache[key];
  } else {
    const file = loadDemoResource(catalog, ctx, filePath);
    const template = file !== undefined ? engine.parse(file, key) : undefined;
    templateCache[key] = template;
    return template;
  }
};

const getDemoTitle = (type) => {
  switch (type) {
    case 'tinydrive':
      return 'Tiny Drive';
    case 'tinymce':
    default:
      return 'TinyMCE'
  }
};

const getScript = (type, docAttrs) => {
  switch (type) {
    case 'tinydrive':
      return docAttrs['tinydrive_live_demo_url'];
    case 'tinymce':
    default:
      return docAttrs['tinymce_live_demo_url'];
  }
};

const getDemoCss = (catalog, type, ctx) => {
  if (type === 'tinydrive') {
    return loadDemoResource(catalog, ctx, 'tinydrive.css');
  } else {
    return '';
  }
};

const getTabs = (type, contentData) => {
  const tabs = defaultTabs.filter((d) => {
    return d.name === 'run' || contentData.hasOwnProperty(d.name);
  }).map((d) => ({
    ...d,
    text: d.name === 'run' ? getDemoTitle(type) : d.text
  }));

  if (!contentData.hasExamplejs) {
    tabs.push({
      name: 'codepen',
      text: 'Edit on CodePen'
    })
  }

  return tabs;
};

const loadContent = (engine, catalog, id, docAttrs) => {
  const data = {};
  const ctx = {
    module: docAttrs['page-module'],
    component: docAttrs['page-component-name'],
    version: docAttrs['page-component-version'],
  };

  Object.entries(validContent).forEach(([type, file]) => {
    const hasKey = 'has' + type[0].toUpperCase() + type.slice(1);

    // If the template file exists then render the content
    const template = loadTemplate(engine, catalog, ctx, `${id}/${file}`);
    if (template !== undefined) {
      data[type] = engine.renderSync(template, {
        baseurl: `${docAttrs['site-url']}/${ctx.component}/${ctx.version}`,
        ...docAttrs
      });
      data[hasKey] = true;
    } else {
      data[hasKey] = false;
    }
  });

  if (!data.hasOwnProperty('examplejs')) {
    data['examplejs'] = data['js'];
  }

  if (!data.hasOwnProperty('examplehtml')) {
    data['examplehtml'] = data['html'];
  }

  return data;
};

module.exports.register = (registry, context) => {
  const catalog = context.contentCatalog;
  const engine = new Liquid();
  engine.registerFilter('uri_escape', (url) => encodeURIComponent(url));

  // Load demo template
  const filePath = path.resolve(__dirname, 'live-demo.adoc.liquid');
  // Take the hard fail approach to stop the build if not able to read the demo template
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const template = engine.parse(fileContent, filePath);

  registry.blockMacro(function() {
    const scriptsLoaded = {};

    const self = this;
    this.named('liveDemo');
    this.process((parent, target, attrs) => {
      // Get the data to pass to the template
      const docAttrs = parent.document.getAttributes();
      const type = attrs.type || 'tinymce';
      const contentData = loadContent(engine, catalog, target, docAttrs);
      const initialTab = attrs.tab || 'run';
      const scriptUrl = attrs.script_url_override || getScript(type, docAttrs);

      // Render the template
      const rootCtx = {
        module: 'ROOT',
        component: docAttrs['page-component-name'],
        version: docAttrs['page-component-version'],
      };
      const renderedContent = engine.renderSync(template, {
        liveDemo: {
          ...attrs,
          type: type,
          css: getDemoCss(catalog, type, rootCtx),
          id: target,
          content: contentData,
          initialTab: initialTab,
          script: {
            include: scriptsLoaded[scriptUrl] !== true,
            url: scriptUrl,
          },
          tabs: getTabs(type, contentData)
        }
      });
      scriptsLoaded[scriptUrl] = true;

      // Parse the content using AsciiDoctor
      const wrapper = self.createBlock(parent, 'open', [], {});
      self.parseContent(wrapper, renderedContent);
      return wrapper;
    })
  })
};
