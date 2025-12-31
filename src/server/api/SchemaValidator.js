export class APIDocumenter {
  constructor() {
    this.endpoints = []
    this.schemas = {}
    this.tags = new Map()
  }

  registerEndpoint(endpoint) {
    this.endpoints.push(endpoint)

    const tag = endpoint.tags?.[0] || 'default'
    if (!this.tags.has(tag)) {
      this.tags.set(tag, [])
    }
    this.tags.get(tag).push(endpoint)
  }

  registerSchema(name, schema) {
    this.schemas[name] = schema
  }

  getOpenAPISpec(info = {}) {
    const paths = {}
    const schemas = { ...this.schemas }

    for (const endpoint of this.endpoints) {
      const pathKey = this.normalizePath(endpoint.path)

      if (!paths[pathKey]) {
        paths[pathKey] = {}
      }

      paths[pathKey][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags || ['default'],
        parameters: this.buildParameters(endpoint),
        requestBody: endpoint.requestSchema ? {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${endpoint.requestSchema}` }
            }
          }
        } : undefined,
        responses: this.buildResponses(endpoint)
      }
    }

    return {
      openapi: '3.0.0',
      info: {
        title: info.title || 'API',
        version: info.version || '1.0.0',
        description: info.description || ''
      },
      paths,
      components: {
        schemas
      }
    }
  }

  normalizePath(path) {
    return path.replace(/:[^/]+/g, match => `{${match.substring(1)}}`)
  }

  buildParameters(endpoint) {
    const params = []

    if (endpoint.pathParams) {
      for (const [name, type] of Object.entries(endpoint.pathParams)) {
        params.push({
          name,
          in: 'path',
          required: true,
          schema: { type }
        })
      }
    }

    if (endpoint.queryParams) {
      for (const [name, schema] of Object.entries(endpoint.queryParams)) {
        params.push({
          name,
          in: 'query',
          required: schema.required,
          schema
        })
      }
    }

    return params.length > 0 ? params : undefined
  }

  buildResponses(endpoint) {
    const responses = {}

    for (const [status, response] of Object.entries(endpoint.responses || { 200: { description: 'Success' } })) {
      responses[status] = {
        description: response.description,
        content: response.schema ? {
          'application/json': {
            schema: typeof response.schema === 'string'
              ? { $ref: `#/components/schemas/${response.schema}` }
              : response.schema
          }
        } : undefined
      }
    }

    return responses
  }

  getMarkdownDocumentation() {
    let markdown = '# API Documentation\n\n'

    for (const [tag, endpoints] of this.tags) {
      markdown += `## ${tag}\n\n`

      for (const endpoint of endpoints) {
        markdown += this.buildEndpointMarkdown(endpoint)
        markdown += '\n'
      }
    }

    return markdown
  }

  buildEndpointMarkdown(endpoint) {
    let markdown = `### ${endpoint.method} ${endpoint.path}\n\n`

    if (endpoint.summary) {
      markdown += `**Summary**: ${endpoint.summary}\n\n`
    }

    if (endpoint.description) {
      markdown += `${endpoint.description}\n\n`
    }

    if (endpoint.pathParams) {
      markdown += '**Path Parameters**:\n'
      for (const [name, type] of Object.entries(endpoint.pathParams)) {
        markdown += `- \`${name}\` (${type})\n`
      }
      markdown += '\n'
    }

    if (endpoint.queryParams) {
      markdown += '**Query Parameters**:\n'
      for (const [name, schema] of Object.entries(endpoint.queryParams)) {
        const required = schema.required ? 'required' : 'optional'
        markdown += `- \`${name}\` (${schema.type}) - ${required}\n`
      }
      markdown += '\n'
    }

    if (endpoint.requestSchema) {
      markdown += `**Request Body**:\n\`\`\`json\n${JSON.stringify(this.schemas[endpoint.requestSchema], null, 2)}\n\`\`\`\n\n`
    }

    if (endpoint.responses) {
      markdown += '**Responses**:\n'
      for (const [status, response] of Object.entries(endpoint.responses)) {
        markdown += `- \`${status}\`: ${response.description}\n`
      }
      markdown += '\n'
    }

    return markdown
  }
}
