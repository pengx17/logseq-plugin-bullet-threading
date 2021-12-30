import "@logseq/libs";
import { logseq as PL } from "../package.json";

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

async function main() {
  const width = logseq.settings?.width ?? 2;
  logseq.provideStyle(`
  :root { --ls-block-bullet-threading-width-overwrite: ${width}px; }
  `);

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
      key: PL.id,
      style: css,
    });
    persist({
      css,
      version: latestVersion,
    });
  }
}

logseq.ready(main).catch(console.error);
