import prompts from "prompts";
import { PromptType } from "prompts";
import fs from "fs/promises";

async function main() {
  const text = await fs.readFile("./output/dupes.json", "utf-8");
  const dupes = JSON.parse(text);
  const size = dupes.length;
  console.log(size, "dupes");
  const questions = dupes.map((list, index) => ({
    type: "select" as PromptType,
    name: index.toString(),
    message: "Select file to keep",
    choices: list.map((value: string) => ({
      title: value,
      value,
    })),
  }));
  const onSubmit = (
    prompt: prompts.PromptObject<string>,
    answer: any,
    answers: any[]
  ) => {
    const answered = Object.entries(answers).length;
    const remaining = size - answered;
    console.log(remaining, "remaining");
  };
  const response = await prompts(questions, { onSubmit });
  const values = Object.values(response);
  await fs.writeFile("./output/keep.json", JSON.stringify(values));
}

main();
