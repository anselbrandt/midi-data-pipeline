// https://bushgrafts.com/midi/
// https://bushgrafts.com/jazz/Midi%20site/
// https://bushgrafts.com/jazz/
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { parseDocument, DomUtils } from "htmlparser2";

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const mkdirs = async (dirs: string[]) => {
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir);
      console.log("creating ", dir);
    } catch (error: any) {
      if (error.code === "EEXIST") console.log(`${dir} already exists`);
      if (error.code !== "EEXIST") console.log(error);
    }
  }
};

export const getHtml = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  return text;
};

export const getHrefs = (html: string) => {
  const dom = parseDocument(html);
  const elements = DomUtils.getElementsByTagName("a", dom);
  const hrefs = elements.map((elem) => {
    const text = elem.lastChild?.type === "text" && elem.lastChild.data;
    const href = elem.attribs.href;

    return { href, name: text || "" };
  });
  return hrefs;
};

export interface Link {
  href: string;
  name: string;
}

interface Options {
  hrefs: Link[];
  url: string;
}

export const getCleanHrefs = ({ hrefs, url }: Options) => {
  const links = hrefs
    .filter(
      (link) =>
        link.href &&
        (link.href.slice(-4) === ".mid" || link.href.slice(-4) === ".MID")
    )
    .map((link) => {
      const name = link.name
        .replaceAll("\n", "")
        .replaceAll("–", "-")
        .replaceAll("’", "'")
        .replace(".>", "")
        .replaceAll("...", ".")
        .replaceAll("..", ".")
        .replaceAll("…", "")
        .replaceAll(" ", "_")
        .replaceAll("/", "-")
        .replace(".MID", ".mid");

      const nameWithExt = name.includes(".mid") ? name : name + ".mid";
      const filename = nameWithExt.replaceAll("..", ".");
      return {
        href: link.href.includes("http") ? link.href : url + link.href,
        name: filename,
      };
    });
  return links;
};

export const dedupeUrls = (links: Link[]) => {
  const set = new Set();
  const deduped = links.filter((link) => {
    const exists = set.has(link.href);
    if (!exists) {
      set.add(link.href);
      return true;
    } else {
      return false;
    }
  });
  return deduped;
};

export const dedupeNames = (links: Link[]) => {
  const set = new Set();
  const deduped = links.map((link, index) => {
    const lowerCase = link.name.toLowerCase();
    const exists = set.has(lowerCase);
    if (exists) {
      return {
        ...link,
        name: `${link.name.replace(".mid", "")}${index}.mid`,
      };
    } else {
      set.add(lowerCase);
      return link;
    }
  });
  return deduped;
};

export const getLinks = async (urls: string[]) => {
  await mkdirs(["./html"]);
  const allLinks: Link[][] = [];
  for (const i in urls) {
    const url = urls[i];
    const html = await getHtml(url);
    const htmlPath = path.join("./html", `${i}.html`);
    console.log("writing", htmlPath);
    await fs.writeFile(htmlPath, html);
    const hrefs = getHrefs(html);
    const links = getCleanHrefs({ hrefs, url });
    allLinks.push(links);
  }
  const linkList = allLinks.flat().sort((a, b) => a.name.localeCompare(b.name));
  const dedupedUrls = dedupeUrls(linkList);
  const dedupedNames = dedupeNames(dedupedUrls);
  return dedupedNames;
};

export const downloadFile = async (link: Link) => {
  const filename = link.name;
  const res = await fetch(link.href);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(filename);
  await fs.writeFile(`./data/${filename}`, buffer);
};

export const downloadLinks = async (links: Link[]) => {
  await mkdirs(["./data"]);
  for (const link of links) {
    await downloadFile(link);
  }
};

export const downloadData = async (urls: string[]) => {
  await mkdirs(["./output"]);
  const links = await getLinks(urls);
  const linksPath = path.join("./output", "links.json");
  console.log("writing", linksPath);
  await fs.writeFile(linksPath, JSON.stringify(links));
  await downloadLinks(links);
};

export const getFailed = async () => {
  const str = await fs.readFile("./output/links.json", "utf-8");
  const links = JSON.parse(str);
  const files = await fs.readdir("./data");
  const failed = links.filter((link) => !files.includes(link.name));
  if (failed.length)
    await fs.writeFile("./output/failed.json", JSON.stringify(failed));
  console.log(failed.length, "fails");
  return failed;
};

export const retry = async () => {
  const failed = await getFailed();
  for (const file of failed) {
    await downloadFile(file);
  }
};
