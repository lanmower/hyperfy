import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class PromptBuilder {
  constructor() {
    const docsPath = path.join(__dirname, '../../client/public/ai-docs.md')
    this.docs = fs.readFileSync(docsPath, 'utf8')
  }

  buildCreatePrompt(userPrompt) {
    return `${this.docs}
===============
You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
===============
Respond with the javascript needed to generate the following:\n\n"${userPrompt}"`
  }

  buildEditPrompt(code, userPrompt) {
    return `${this.docs}
===============
You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
Here is the existing script that you will be working with:
===============
${code}
===============
Please edit the code above to satisfy the following request:\n\n"${userPrompt}"`
  }

  buildFixPrompt(code, error) {
    return `${this.docs}
===============
You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
Here is the existing script that you will be working with:
===============
${code}
===============
This code has an error please fix it:\n\n"${JSON.stringify(error, null, 2)}"`
  }

  buildClassifyPrompt(userPrompt) {
    return `You are a classifier. We will give you a prompt that a user has entered to generate a 3D object and your job is respond with a short name for the object. For example if someone prompts "a cool gamer desk with neon lights" you would respond with something like "Gamer Desk" because it is a short descriptive name that captures the essence of the object.
===============
Please classify the following prompt:\n\n"${userPrompt}"`
  }
}
