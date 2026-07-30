// English strings for the builder chrome. `he.ts` mirrors this shape exactly —
// `Strings` is derived from this file, so adding a key here makes TypeScript
// require it there too. Dropdown labels for the schema enums live under
// `enums` below; the values stored in the JSON are always the raw keys, never
// the translated label. HTTP methods and LTR/RTL stay untranslated — they are
// protocol tokens, not prose.
//
// Note: no `as const`. That keeps `typeof en` widened to `string`, so Hebrew
// values in `he.ts` remain assignable to `Strings`.
export const en = {
  app: {
    title: "Popup Builder",
    newPopup: "+ Start new basic template",
    example: "+ Start with example template",
    savedCount: (n: number) => `${n} saved template${n === 1 ? "" : "s"}`,
    emptyHint: "No templates yet — create one to get started.",
    markActiveTitle: "Mark this template Active",
    active: "Active",
    untitled: "Untitled",
    items: (n: number) => `${n} item${n === 1 ? "" : "s"}`,
    delete: "Delete",
    confirmDelete: (name: string) => `Delete "${name}"?`,
    usingSingle: (name: string) => `Using “${name}”`,
    usingMany: (n: number) => `Using ${n} template${n === 1 ? "" : "s"}`,
    jsonFromHost: "The JSON a host app gets from",
    singleToggleTitle: "Export one JSON object instead of an array",
    singleToggleLabel: "Use just one (export a single JSON)",
    showJson: "Show JSON",
    clear: "Clear",
  },
  edit: {
    backToTemplates: "← All templates",
    tabSetup: "Setup",
    tabLayout: "Layout",
    tabDesign: "Design",
  },
  settings: {
    deliveryHeading: "Delivery · when & how it opens",
    trigger: "Trigger",
    delaySeconds: "Delay (seconds)",
    scrollPercent: "Scroll (%)",
    frequency: "Frequency",
    dismissible: "Dismissible (X / overlay / esc)",
    selectorLabel:
      "Selector (only show on pages containing a matching element — leave blank to always show)",
    selectorPlaceholder: "#product-page, .cart-drawer",
    generateTag: "Generate tag",
    generateTagTitle: "Fill the selector with a tag of this popup's own — no CSS needed",
    tagHint: "Paste this into every page the popup should show on:",
    submissionHeading: "Submission",
    endpointUrl: "Endpoint URL",
    method: "Method",
    methodHintGet: "All values are sent as URL query params.",
    methodHintPost: "All values are sent both as URL query params and in the JSON body.",
    onSuccess: "On success",
    redirectNewTab: "In new tab",
    onErrorMessage: "On error message",
    onErrorPlaceholder: "Something went wrong — please try again.",
    customSubmitValues: "Custom submit callback values",
    keyPlaceholder: "key",
    valuePlaceholder: "value",
    addValue: "+ value",
    designHeading: "Design",
    layout: "Layout",
    direction: "Popup direction",
    dirLtr: "LTR",
    dirRtl: "RTL",
    borderRadius: "Border radius (px)",
    imageUrl: "Image URL",
    successMessage: "Message text",
    redirectUrl: "Redirect URL",
    messageTemplate: "Message template",
    // One line per template, shown under the picker so the merchant knows what
    // the extra fields below it will do before filling them in.
    messageTemplateHint: {
      simple: "Heading and text on a clean confirmation screen.",
      image: "Your image replaces the layout's image — or fills the top two thirds on the basic layout.",
      illustration: "A built-in illustration above the heading and text.",
      coupon: "Heading, text, and the discount code on a ticket the shopper can copy.",
    },
    successHeading: "Heading",
    successHeadingPlaceholder: "You're all set!",
    successImageUrl: "Success image URL",
    illustration: "Illustration",
    addConfetti: "Add confetti (rains over the popup on success)",
    couponCopyable: "Show copy button",
    staticCode: "Static code",
    codeFromResponse: "…or code from response path",
    codeFromResponsePlaceholder: "data.discountCode",
  },
  content: {
    heading: "Content items",
    addSectionAria: "Add section",
    addSection: "+ Add section",
    heightPx: "Height (px)",
    headingText: "Heading text",
    paragraphText: "Paragraph text",
    buttonLabel: "Button label",
    fieldLabel: "Label",
    placeholder: "Placeholder",
    checkboxLabel: "Checkbox label",
    valueLabel: "Value",
    groupLabel: "Group label",
    align: "Align",
    color: "Color",
    backgroundColor: "Background color",
    required: "Required",
    submitKey: "Submit key",
    options: "Options",
    optionLabel: "label",
    optionValue: "value",
    addOption: "+ option",
  },
  json: {
    viewJson: "View JSON",
    errors: (n: number) => `${n} error${n === 1 ? "" : "s"}`,
    title: "JSON",
    copy: "Copy",
    copied: "Copied",
    close: "Close",
  },
  preview: {
    livePreview: "Live preview",
    replay: "↻ Replay",
    disclaimer:
      "Preview ignores the trigger and frequency cap and never submits to a real endpoint.",
  },
  // Seed copy for a new template or section. Shape must satisfy the schema's
  // `DefaultText` — this object is handed straight to the factories, so a
  // missing key is a compile error at the call site.
  defaults: {
    popupName: "Untitled popup",
    heading: "Heading",
    text: "Some descriptive text.",
    emailLabel: "Your email",
    freeTextLabel: "Your answer",
    checkboxLabel: "I agree",
    radioLabel: "Pick one",
    optionA: "Option A",
    optionB: "Option B",
    submit: "Submit",
  },
  // Dropdown option labels for the schema enums. Keys are the literal values
  // stored in the JSON and must cover each union exactly — call sites index
  // these by the union type, so a new schema value fails to compile until it
  // is listed here (and, by `Strings`, translated in every language file).
  // English deliberately echoes the raw stored value; only `redirect` differs,
  // to spell out that the popup closes after handing off the redirect.
  enums: {
    trigger: {
      immediate: "immediate",
      delay: "delay",
      scroll: "scroll",
    },
    frequency: {
      always: "always",
      session: "session",
      day: "day",
      ever: "ever",
    },
    design: {
      basic: "basic",
      "image-behind": "image-behind",
      "image-right": "image-right",
      "image-left": "image-left",
    },
    success: {
      close: "close",
      message: "message",
      redirect: "Redirect and close",
    },
    successTemplate: {
      simple: "Simple",
      image: "Image",
      illustration: "Illustration",
      coupon: "Coupon",
    },
    illustration: {
      check: "Checkmark",
      celebration: "Celebration",
      gift: "Gift",
      envelope: "Envelope",
    },
    align: {
      left: "left",
      center: "center",
      right: "right",
    },
    contentType: {
      heading: "heading",
      text: "text",
      spacer: "spacer",
      email: "email",
      radio: "radio",
      checkbox: "checkbox",
      "free-text-input": "free-text-input",
      "submit-button": "submit-button",
    },
  },
};

export type Strings = typeof en;
