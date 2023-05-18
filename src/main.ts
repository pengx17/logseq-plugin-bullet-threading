import "@logseq/libs";
import { logseq as PL } from "../package.json";
import semver from 'semver';

const KEY = "logseq-bullet-threading";

interface SavedData {
  version: string;
  css: string;
}

const getPersisted = (): SavedData | null => {
  return JSON.parse(localStorage.getItem(KEY) ?? "null");
};

const persisted = getPersisted();

const persist = (data: SavedData) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};

const getLatestVersion = async () => {
  const meta = await fetch(
    "https://api.github.com/repos/pengx17/logseq-dev-theme/releases?per_page=1"
  ).then((res) => res.json());

  return meta[0].name as string; // eg., "v1.23.1"
};

// const cachedVersion = persisted?.version ?? "latest";

const getCSSFromCDN = (v: string) => {
  return fetch(
    `https://cdn.jsdelivr.net/gh/pengx17/logseq-dev-theme@${v}/bullet_threading.css`
  ).then((res) => res.text());
};

function onSettingsChange() {
  let width = logseq.settings?.width ?? 2;
  const color = logseq.settings?.customColor && logseq.settings?.color;
  if (!("" + width).endsWith("px")) {
    width = width + "px";
  }

  const vars: [string, string][] = [
    ["--ls-block-bullet-threading-width-overwrite", width],
  ];

  if (color) {
    vars.push(["--ls-block-bullet-threading-active-color-overwrite", color]);
  }

  const varsString = vars.map((pair) => pair.join(": ") + ";").join("\n");

  logseq.provideStyle({
    key: PL.id + "-vars",
    style: `:root { ${varsString} }`,
  });
}

async function main() {
  onSettingsChange();
  logseq.onSettingsChanged(onSettingsChange);

  // use cached first
  if (persisted) {
    logseq.provideStyle({
      key: PL.id,
      style: persisted.css,
    });
  }
  const latestVersion = await getLatestVersion();
  if (latestVersion !== persisted?.version) {
    console.log(
      "logseq-bullet-threading: updating to latest version " + latestVersion
    );
    // fetch from jsDelivr CDN
    const css = await getCSSFromCDN(latestVersion);
    logseq.provideStyle({
      key: PL.id + "-styles",
      style: css,
    });
    persist({
      css,
      version: latestVersion,
    });
  }

  // patches
  const appVersion = await logseq.App.getInfo('version')
  if (
    appVersion && semver.valid(appVersion) &&
    semver.gt(appVersion, '0.9.6')) {
    logseq.provideStyle(`
      .ls-block[haschild] > div > .block-content-wrapper::before {
        left: -13px;
      }
      
      .ls-block .ls-block > div > div.items-center::before {
        right: 16px;
      }
    `)
  }
}

logseq
  .useSettingsSchema([
    {
      key: "width",
      default: "2px",
      description: "Width of the bullet threading.",
      title: "Width of the bullet threading path",
      type: "enum",
      enumPicker: "radio",
      enumChoices: ["1px", "2px", "3px"],
    },
    {
      key: "customColor",
      default: false,
      description: "Overwrite threading path color?",
      title: "Whether or not to overwrite threading path color.",
      type: "boolean",
    },
    {
      key: "color",
      default: "",
      description:
        "Color of the bullet threading. You need to enable 'Overwrite threading path color?' first",
      title: "Color of the bullet threading path.",
      type: "string",
      inputAs: "color",
    },
  ])
  .ready(main)
  .catch(console.error);
