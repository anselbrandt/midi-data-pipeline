import { describe, expect, it } from "vitest";
import { getHrefs, getLinks } from "./scripts";

const html = `<a href="https://www.bushgrafts.com/jazz/Midi%20site/SweetWay2.mid"><br />In Your Own Sweet Way (tk2)</a> [M]<br />`;

const url = `https://bushgrafts.com/jazz/`;

const hrefs = [
  {
    href: "Effendi%20-%20McCoy%20Tyner.mid",
    name: "Effendi - McCoy Tyne..>",
  },
];

describe("parse test", () => {
  it("get hrefs", () => {
    const hrefs = getHrefs(html);
    expect(hrefs).toStrictEqual([
      {
        href: "https://www.bushgrafts.com/jazz/Midi%20site/SweetWay2.mid",
        name: "In Your Own Sweet Way (tk2)",
      },
    ]);
  });
  it("get links", () => {
    const links = getLinks({ hrefs, url });
    expect(links).toStrictEqual([
      {
        href: "https://bushgrafts.com/jazz/Effendi%20-%20McCoy%20Tyner.mid",
        name: "Effendi - McCoy Tyne..>.mid",
      },
    ]);
  });
});
