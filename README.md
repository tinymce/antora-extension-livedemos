# Antora extension live demos

This repo maintains an Antora extension which enables live demos for [TinyMCE docs](https://www.tiny.cloud/docs).

# How to

1. Install dependency
  ```bash
    yarn add -D @tinymce/antora-extension-livedemos
  ```

2. Configure the `tinymce_live_demo_url` attribute in the Antora playbook config
```yml
  asciidoc
    attributes:
      tinymce_live_demo_url: URL_to_script_file
```

3. Add the dependency name to the config file to enable
```yml
asciidoc:
  extensions:
    - '@tinymce/antora-extension-livedemos'
```

# Usage

Use macro `liveDemo::<id>[]` to enable a live demo in your article. For example:

```
liveDemo::hello-world[]
```

Files are required to be under the `examples/live-demos/<id>/` directory in your Antora module. The following files are available for use:
  - index.html
  - index.js
  - index.css (optional)
  - example.js (optional)
  - example.html (optional)

**Note:** If `index.css` is omitted, the CSS tab will not display. [Here](./live-demos/hello-world/) is a simple demo for the above example

## The purpose of `example.js`

When the file is present the live-demo js tab will display the contents of `example.js`, while the real demo code executes with `index.js`. Useful for when we want to hide actual `api-keys` or `tokens`: 'example-token'. When the `example.js` file is present, the link to the external codepen site is disabled.

## Parameters

  - id (required): Folder for files, and used in CSS classes
  - type (optional): Specifies if the example is `tinymce` or `tinydrive` specific. Default is `tinymce`
  - tab (optional): The first tab to open. Valid options are "run", "html", "css" or "js". Default to "run"
  - height (optional - no default): `min-height` in pixels
  - script_url_override (optional - no default):
    - Override the full tinymce.min.js URL, including api key
    - Useful for testing things that aren't in the main channel, yet
    - Remove this setting once the feature is in the main channel

**Note**: Provide optional parameters in comma separated name-value pairs into the square bracket following `id`.
