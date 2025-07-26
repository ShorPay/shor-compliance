import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface JurisdictionTemplate {
  version: string;
  metadata: {
    jurisdiction: string;
    regulation_framework: string;
    last_updated: string;
    references: string[];
  };
  modules: any;
}

export interface JurisdictionInfo {
  id: string;
  name: string;
  framework: string;
  type: string;
  description: string;
}

export class JurisdictionLoader {
  private templatesDir: string;
  private templates: Map<string, JurisdictionTemplate> = new Map();

  constructor() {
    // Look for jurisdictions in the policy-library folder
    this.templatesDir = path.join(process.cwd(), 'policy-library', 'jurisdictions');
    // Fallback to src/data if policy-library doesn't exist
    if (!fs.existsSync(this.templatesDir)) {
      this.templatesDir = path.join(__dirname, '..', 'data', 'jurisdictions');
    }
    this.loadTemplates();
  }

  private loadTemplates(): void {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }

    const files = fs.readdirSync(this.templatesDir);
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const templateId = path.basename(file, path.extname(file));
        const filePath = path.join(this.templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const template = yaml.load(content) as JurisdictionTemplate;
        this.templates.set(templateId, template);
      }
    }
  }

  getAvailableJurisdictions(): JurisdictionInfo[] {
    const jurisdictions: JurisdictionInfo[] = [];
    
    for (const [id, template] of this.templates.entries()) {
      const parts = id.split('-');
      const jurisdiction = parts[0].toUpperCase();
      const type = parts.slice(1).join(' ').replace(/-/g, ' ');
      
      jurisdictions.push({
        id,
        name: template.metadata.jurisdiction,
        framework: template.metadata.regulation_framework,
        type: type,
        description: `${template.metadata.jurisdiction} ${type} compliance template based on ${template.metadata.regulation_framework}`
      });
    }
    
    return jurisdictions;
  }

  getTemplate(jurisdictionId: string): JurisdictionTemplate | undefined {
    return this.templates.get(jurisdictionId);
  }

  generateComplianceSpec(jurisdictionId: string, customizations?: any): any {
    const template = this.getTemplate(jurisdictionId);
    if (!template) {
      throw new Error(`Jurisdiction template '${jurisdictionId}' not found`);
    }

    // Deep clone the template
    const spec = JSON.parse(JSON.stringify(template));
    
    // Apply customizations if provided
    if (customizations) {
      this.applyCustomizations(spec, customizations);
    }
    
    // Add generation metadata
    spec.metadata.generated_from = jurisdictionId;
    spec.metadata.generated_at = new Date().toISOString();
    
    return spec;
  }

  private applyCustomizations(spec: any, customizations: any): void {
    // Merge customizations into the spec
    for (const [key, value] of Object.entries(customizations)) {
      if (key === 'modules') {
        // Deep merge modules
        for (const [modKey, modValue] of Object.entries(value as any)) {
          if (spec.modules[modKey]) {
            Object.assign(spec.modules[modKey], modValue);
          } else {
            spec.modules[modKey] = modValue;
          }
        }
      } else if (key === 'metadata') {
        // Merge metadata
        Object.assign(spec.metadata, value);
      } else {
        // Direct assignment for other keys
        spec[key] = value;
      }
    }
  }

  searchJurisdictions(query: string): JurisdictionInfo[] {
    const results = this.getAvailableJurisdictions();
    const searchTerm = query.toLowerCase();
    
    return results.filter(j => 
      j.name.toLowerCase().includes(searchTerm) ||
      j.framework.toLowerCase().includes(searchTerm) ||
      j.type.toLowerCase().includes(searchTerm) ||
      j.id.toLowerCase().includes(searchTerm)
    );
  }
}