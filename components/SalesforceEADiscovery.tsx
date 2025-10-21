'use client'
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Loader2, Trash2, Upload } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import DocumentImport from '@/components/DocumentImport';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

interface DriverBox {
  text: string;
  lines: string[];
  width: number;
  height: number;
}

interface Engagement {
  id: string;
  created_at: string;
  company_name: string;
  industry: string;
  business_context: string;
  current_challenges: string;
  strategic_goals: string;
  technical_landscape: string;
  constraints: string;
  timeline: string;
  budget: string;
  artifacts: any;
}

interface Artifacts {
  capabilityMap: any;
  currentStateArchitecture: any;
  futureStateArchitecture: any;
  prioritizationMatrix: any;
  strategicRoadmap: any;
}

export default function SalesforceEADiscovery() {
  const [view, setView] = useState('home');
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [currentEngagementId, setCurrentEngagementId] = useState<string | null>(null);
  const [discoveryData, setDiscoveryData] = useState({
    companyName: '', industry: '', businessContext: '', currentChallenges: '',
    strategicGoals: '', technicalLandscape: '', constraints: '', timeline: '', budget: ''
  });
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showImport, setShowImport] = useState(false);

  const toString = (value: any, fallback: string = ''): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (!value) return fallback;
    if (typeof value === 'object') {
      return value.name || value.description || value.text || value.value || value.product || value.benefit || fallback;
    }
    return fallback;
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    loadEngagementsFromSupabase()
  }, []);

   const loadEngagementsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('engagements')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setEngagements(data || [])
    } catch (error) {
      console.error('Error loading engagements:', error)
      showNotification('Failed to load engagements', 'error')
    }
  }

const handleImportComplete = (extractedData: Record<string, string>) => {
  // Merge new data with existing data instead of overwriting
  setDiscoveryData(prev => ({
    companyName: extractedData.companyName || prev.companyName,
    industry: extractedData.industry || prev.industry,
    businessContext: combineText(prev.businessContext, extractedData.businessContext),
    currentChallenges: combineText(prev.currentChallenges, extractedData.currentChallenges),
    strategicGoals: combineText(prev.strategicGoals, extractedData.strategicGoals),
    technicalLandscape: combineText(prev.technicalLandscape, extractedData.technicalLandscape),
    constraints: combineText(prev.constraints, extractedData.constraints),
    timeline: extractedData.timeline || prev.timeline,
    budget: extractedData.budget || prev.budget
  }));
  
  setShowImport(false);
  showNotification('Discovery data imported and merged successfully! Review and edit as needed.', 'success');
};

// Helper function to intelligently combine text fields
const combineText = (existing: string, newText: string): string => {
  if (!existing) return newText || '';
  if (!newText) return existing;
  
  // If new text is very similar to existing, don't duplicate
  if (existing.toLowerCase().includes(newText.toLowerCase().substring(0, 50))) {
    return existing;
  }
  
  // Combine with a separator
  return `${existing}\n\n${newText}`;
};
 
  const saveEngagement = async () => {
    const engagement = {
      id: currentEngagementId || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      company_name: discoveryData.companyName,
      industry: discoveryData.industry,
      business_context: discoveryData.businessContext,
      current_challenges: discoveryData.currentChallenges,
      strategic_goals: discoveryData.strategicGoals,
      technical_landscape: discoveryData.technicalLandscape,
      constraints: discoveryData.constraints,
      timeline: discoveryData.timeline,
      budget: discoveryData.budget,
      artifacts: artifacts,
    }

    if (!currentEngagementId) {
      setCurrentEngagementId(engagement.id)
    }

    try {
      const { error } = await supabase
        .from('engagements')
        .upsert(engagement)
      
      if (error) throw error
      
      await loadEngagementsFromSupabase()
      showNotification('Engagement saved!', 'success')
    } catch (error) {
      console.error('Error saving engagement:', error)
      showNotification('Failed to save engagement', 'error')
    }
  }

  const loadEngagement = (eng: Engagement) => {
    setCurrentEngagementId(eng.id);
    setDiscoveryData({
      companyName: eng.company_name || '',
      industry: eng.industry || '',
      businessContext: eng.business_context || '',
      currentChallenges: eng.current_challenges || '',
      strategicGoals: eng.strategic_goals || '',
      technicalLandscape: eng.technical_landscape || '',
      constraints: eng.constraints || '',
      timeline: eng.timeline || '',
      budget: eng.budget || ''
    });
    setArtifacts(eng.artifacts);
    setView(eng.artifacts ? 'artifacts' : 'discovery');
  };

  const deleteEngagement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const { error } = await supabase
        .from('engagements')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await loadEngagementsFromSupabase()
      showNotification('Engagement deleted', 'success')
    } catch (error) {
      console.error('Error deleting engagement:', error)
      showNotification('Failed to delete engagement', 'error')
    }
  }

  const startNew = () => {
    setCurrentEngagementId(null);
    setDiscoveryData({
      companyName: '', industry: '', businessContext: '', currentChallenges: '',
      strategicGoals: '', technicalLandscape: '', constraints: '', timeline: '', budget: ''
    });
    setArtifacts(null);
    setView('discovery');
  };

  const generateArtifacts = async () => {
    setLoading(true)
    showNotification('Starting generation...', 'success')
    
    try {
      const response = await fetch('/api/generate-artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discoveryData }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate artifacts')
      }

      const data = await response.json()
      
      setArtifacts(data.artifacts)
      
      setTimeout(() => {
        saveEngagement()
        setView('artifacts')
        showNotification('Artifacts generated!', 'success')
      }, 500)
    } catch (error: any) {
      console.error('Generation error:', error)
      showNotification(`Failed: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const downloadSVG = (svgContent: string, filename: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Downloaded ${filename}!`, 'success');
  };

const generateCapabilityMapSVG = () => {
  if (!artifacts || !artifacts.capabilityMap) return '';
  
  const capMap = artifacts.capabilityMap;
  const drivers = capMap.businessDrivers || [];
  
  // Helper function to wrap text
  const wrapText = (text: string, maxChars: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };
  
  // Calculate driver box dimensions and positions
  const driverBoxes = drivers.slice(0, 6).map((d: any) => {
    const text = toString(d);
    const lines = wrapText(text, 25);
    const width = Math.max(180, Math.min(280, text.length * 8));
    const height = Math.max(60, 25 + (lines.length * 18));
    return { text, lines, width, height };
  });
  
  // Calculate total width and starting X position to center drivers
  const spacing = 20;
  const totalWidth = driverBoxes.reduce((sum: number, box: DriverBox) => sum + box.width, 0) + (spacing * (driverBoxes.length - 1));
  const startX = (1400 - totalWidth) / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="1000" xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="1000" fill="#f8f9fa"/>
  
  <text x="700" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#1a1a1a">
    Salesforce Business Capability Map
  </text>
  <text x="700" y="80" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666">
    ${discoveryData.companyName} - ${discoveryData.industry}
  </text>
  
  <text x="50" y="130" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0176D3">
    Business Drivers
  </text>
  
  ${driverBoxes.map((box: DriverBox, i: number) => {
    let currentX = startX;
    for (let j = 0; j < i; j++) {
      currentX += driverBoxes[j].width + spacing;
    }
    
    return `
  <rect x="${currentX}" y="145" width="${box.width}" height="${box.height}" fill="#0176D3" rx="5"/>
  ${box.lines.map((line, lineIdx) => `
  <text x="${currentX + box.width / 2}" y="${165 + (lineIdx * 18)}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${line}</text>
  `).join('')}
    `;
  }).join('')}
  
  ${[
    { key: 'sales', title: 'Sales', x: 50, y: 230, color: '#0176D3' },
    { key: 'service', title: 'Service', x: 470, y: 230, color: '#2E844A' },
    { key: 'marketing', title: 'Marketing', x: 890, y: 230, color: '#8B46FF' },
    { key: 'commerce', title: 'Commerce', x: 50, y: 550, color: '#FF6B35' },
    { key: 'platformData', title: 'Platform &amp; Data', x: 470, y: 550, color: '#00A1E0' },
    { key: 'industrySpecific', title: 'Industry-Specific', x: 890, y: 550, color: '#FFB75D' }
  ].map(cat => {
    const caps = (capMap[cat.key] || []).slice(0, 4);
    return `
  <rect x="${cat.x}" y="${cat.y}" width="400" height="300" fill="${cat.color}" opacity="0.1" stroke="${cat.color}" stroke-width="2" rx="8"/>
  <text x="${cat.x + 10}" y="${cat.y + 30}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${cat.color}">
    ${cat.title}
  </text>
  ${caps.map((cap: any, i: number) => {
    const capText = toString(cap.capability);
    const capLines = wrapText(capText, 40);
    const products = (cap.salesforceProducts || []).slice(0, 3).map((p: any) => toString(p)).join(', ');
    const productLines = wrapText(products, 45);
    
    return `
  <rect x="${cat.x + 10}" y="${cat.y + 50 + (i * 60)}" width="380" height="50" fill="white" stroke="${cat.color}" stroke-width="1" rx="4"/>
  ${capLines.slice(0, 2).map((line, lineIdx) => `
  <text x="${cat.x + 20}" y="${cat.y + 68 + (i * 60) + (lineIdx * 14)}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#333">
    ${line}
  </text>
  `).join('')}
  ${productLines.slice(0, 1).map((line, lineIdx) => `
  <text x="${cat.x + 20}" y="${cat.y + 88 + (i * 60)}" font-family="Arial, sans-serif" font-size="10" fill="#666">
    ${line}
  </text>
  `).join('')}
  `;
  }).join('')}
    `;
  }).join('')}
  
  <text x="50" y="980" font-family="Arial, sans-serif" font-size="12" fill="#666">
    Generated by Salesforce EA Discovery Assistant | ${new Date().toLocaleDateString()}
  </text>
</svg>`;
};

  const generatePaceLayerDiagram = (isCurrentState: boolean) => {
    if (!artifacts) return '';
    
    const title = isCurrentState ? 'Current State Architecture' : 'Future State Architecture';
    const archData = isCurrentState ? artifacts.currentStateArchitecture : artifacts.futureStateArchitecture;
    
    if (!archData) return '';
    
    const soi = (archData.systemsOfInnovation || []).slice(0, 4);
    const sod = (archData.systemsOfDifferentiation || []).slice(0, 4);
    const sor = (archData.systemsOfRecord || []).slice(0, 4);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="900" fill="#f8f9fa"/>
  
  <text x="700" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#1a1a1a">
    ${title} - Pace Layered Architecture
  </text>
  <text x="700" y="80" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#666">
    ${toString(archData.overview).substring(0, 100)}
  </text>
  
  <rect x="50" y="120" width="1300" height="220" fill="#4CAF50" opacity="0.2" stroke="#4CAF50" stroke-width="3" rx="10"/>
  <text x="70" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#2E7D32">
    Systems of Innovation
  </text>
  <text x="70" y="175" font-family="Arial, sans-serif" font-size="13" fill="#555">
    Fast pace | Experimentation | 6-12 months lifecycle | ${soi.length} system(s)
  </text>
  ${soi.map((sys: any, i: number) => `
  <rect x="${70 + (i % 4) * 320}" y="${195 + Math.floor(i / 4) * 65}" width="300" height="60" fill="#4CAF50" stroke="#2E7D32" stroke-width="2" rx="5"/>
  <text x="${80 + (i % 4) * 320}" y="${215 + Math.floor(i / 4) * 65}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white">${toString(sys.name).substring(0, 30)}</text>
  <text x="${80 + (i % 4) * 320}" y="${233 + Math.floor(i / 4) * 65}" font-family="Arial, sans-serif" font-size="11" fill="#E8F5E9">${toString(isCurrentState ? sys.emergingCapability : sys.futureVision).substring(0, 35)}</text>
  `).join('')}
  
  <rect x="50" y="360" width="1300" height="220" fill="#FF9800" opacity="0.2" stroke="#FF9800" stroke-width="3" rx="10"/>
  <text x="70" y="390" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#E65100">
    Systems of Differentiation
  </text>
  <text x="70" y="415" font-family="Arial, sans-serif" font-size="13" fill="#555">
    Medium pace | Competitive advantage | 1-3 years lifecycle | ${sod.length} system(s)
  </text>
  ${sod.map((sys: any, i: number) => `
  <rect x="${70 + (i % 4) * 320}" y="${435 + Math.floor(i / 4) * 65}" width="300" height="60" fill="#FF9800" stroke="#E65100" stroke-width="2" rx="5"/>
  <text x="${80 + (i % 4) * 320}" y="${455 + Math.floor(i / 4) * 65}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white">${toString(sys.name).substring(0, 30)}</text>
  <text x="${80 + (i % 4) * 320}" y="${473 + Math.floor(i / 4) * 65}" font-family="Arial, sans-serif" font-size="11" fill="#FFF3E0">${toString(sys.businessCapability || sys.futureVision).substring(0, 35)}</text>
  `).join('')}
  
  <rect x="50" y="600" width="1300" height="220" fill="#2196F3" opacity="0.2" stroke="#2196F3" stroke-width="3" rx="10"/>
  <text x="70" y="630" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#0D47A1">
    Systems of Record
  </text>
  <text x="70" y="655" font-family="Arial, sans-serif" font-size="13" fill="#555">
    Slow pace | Core operations | 3-10 years lifecycle | ${sor.length} system(s)
  </text>
  ${sor.map((sys: any, i: number) => `
  <rect x="${70 + (i % 4) * 320}" y="${675 + Math.floor(i / 4) * 65}" width="300" height="60" fill="#2196F3" stroke="#0D47A1" stroke-width="2" rx="5"/>
  <text x="${80 + (i % 4) * 320}" y="${695 + Math.floor(i / 4) * 65}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white">${toString(sys.name).substring(0, 30)}</text>
  <text x="${80 + (i % 4) * 320}" y="${713 + Math.floor(i / 4) * 65}" font-family="Arial, sans-serif" font-size="11" fill="#E3F2FD">${toString(sys.businessCapability || sys.futureVision).substring(0, 35)}</text>
  `).join('')}
  
  <text x="50" y="870" font-family="Arial, sans-serif" font-size="12" fill="#666">
    Generated by Salesforce EA Discovery Assistant | ${discoveryData.companyName} | ${new Date().toLocaleDateString()}
  </text>
</svg>`;
  };

  const generatePrioritizationMatrix = () => {
    if (!artifacts || !artifacts.prioritizationMatrix) return '';
    
    const matrix = artifacts.prioritizationMatrix || [];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="900" fill="#f8f9fa"/>
  
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#1a1a1a">
    Initiative Prioritization Matrix
  </text>
  <text x="600" y="80" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#666">
    ${discoveryData.companyName}
  </text>
  
  <rect x="150" y="150" width="450" height="350" fill="#ffcdd2" opacity="0.3"/>
  <rect x="600" y="150" width="450" height="350" fill="#fff9c4" opacity="0.3"/>
  <rect x="150" y="500" width="450" height="350" fill="#c8e6c9" opacity="0.3"/>
  <rect x="600" y="500" width="450" height="350" fill="#a5d6a7" opacity="0.5"/>
  
  <line x1="150" y1="150" x2="150" y2="850" stroke="#333" stroke-width="3"/>
  <line x1="150" y1="850" x2="1050" y2="850" stroke="#333" stroke-width="3"/>
  
  <polygon points="150,140 145,155 155,155" fill="#333"/>
  <polygon points="1060,850 1045,845 1045,855" fill="#333"/>
  
  <text x="50" y="500" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#333" transform="rotate(-90 50 500)">
    Complexity / Effort
  </text>
  <text x="70" y="200" font-family="Arial, sans-serif" font-size="14" fill="#666">High</text>
  <text x="70" y="830" font-family="Arial, sans-serif" font-size="14" fill="#666">Low</text>
  
  <text x="600" y="890" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#333">
    Business Impact / Value
  </text>
  <text x="180" y="870" font-family="Arial, sans-serif" font-size="14" fill="#666">Low</text>
  <text x="1010" y="870" font-family="Arial, sans-serif" font-size="14" fill="#666">High</text>
  
  <text x="375" y="300" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">🔴 Avoid</text>
  <text x="375" y="325" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666">Low Value, High Effort</text>
  
  <text x="825" y="300" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#f57f17">🟡 Consider</text>
  <text x="825" y="325" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666">High Value, High Effort</text>
  
  <text x="375" y="650" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#558b2f">🟢 Quick Wins</text>
  <text x="375" y="675" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666">Low Value, Low Effort</text>
  
  <text x="825" y="650" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">🟢 Strategic</text>
  <text x="825" y="675" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666">High Value, Low Effort</text>
  
  ${matrix.map((item: any, i: number) => {
const valueMap: { [key: string]: number } = { 'Low': 250, 'Medium': 600, 'High': 950 };
const effortMap: { [key: string]: number } = { 'Low': 750, 'Medium': 500, 'High': 250 };

const x = valueMap[toString(item.businessValue)] || 600;
const y = effortMap[toString(item.effort)] || 500;
    
    let color = '#666';
    const val = toString(item.businessValue);
    const eff = toString(item.effort);
    
    if (val === 'High' && eff === 'Low') color = '#2e7d32';
    else if (val === 'Low' && eff === 'Low') color = '#558b2f';
    else if (val === 'High' && eff === 'High') color = '#f57f17';
    else if (val === 'Low' && eff === 'High') color = '#c62828';
    else if (val === 'High') color = '#2e7d32';
    else if (val === 'Medium') color = '#f57f17';
    
    return `
  <circle cx="${x}" cy="${y}" r="40" fill="${color}" opacity="0.9" stroke="#fff" stroke-width="3"/>
  <text x="${x}" y="${y + 8}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">${toString(item.priority)}</text>
  <text x="${x}" y="${y - 50}" font-family="Arial, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#333">${toString(item.initiative).substring(0, 20)}</text>
  `;
  }).join('')}
  
  <text x="50" y="890" font-family="Arial, sans-serif" font-size="11" fill="#999">
    Generated by Salesforce EA Discovery Assistant | ${new Date().toLocaleDateString()}
  </text>
</svg>`;
  };

  const generateRoadmapSVG = () => {
    if (!artifacts || !artifacts.strategicRoadmap) return '';
    
    const roadmap = artifacts.strategicRoadmap || [];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="800" fill="#f8f9fa"/>
  
  <text x="700" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#1a1a1a">
    Strategic Roadmap
  </text>
  <text x="700" y="80" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666">
    ${discoveryData.companyName} - Salesforce Implementation Journey
  </text>
  
  <line x1="100" y1="150" x2="1300" y2="150" stroke="#0176D3" stroke-width="4"/>
  
  ${roadmap.slice(0, 4).map((phase: any, i: number) => {
    const x = 150 + (i * 300);
    const initiatives = (phase.initiatives || []).slice(0, 4);
    const outcomes = (phase.outcomes || []).slice(0, 4);
    
    return `
  <circle cx="${x}" cy="150" r="20" fill="#0176D3" stroke="#fff" stroke-width="3"/>
  <text x="${x}" y="155" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${i + 1}</text>
  
  <rect x="${x - 125}" y="200" width="250" height="500" fill="white" stroke="#0176D3" stroke-width="2" rx="8"/>
  <rect x="${x - 125}" y="200" width="250" height="60" fill="#0176D3" rx="8"/>
  <text x="${x}" y="235" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">
    ${toString(phase.phase)}
  </text>
  
  <text x="${x - 115}" y="290" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0176D3">
    Initiatives:
  </text>
  ${initiatives.map((init: any, j: number) => `
  <text x="${x - 115}" y="${310 + (j * 25)}" font-family="Arial, sans-serif" font-size="12" fill="#333">
    • ${toString(init).substring(0, 30)}
  </text>
  `).join('')}
  
  <text x="${x - 115}" y="${430}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#2E844A">
    Outcomes:
  </text>
  ${outcomes.map((out: any, j: number) => `
  <text x="${x - 115}" y="${450 + (j * 25)}" font-family="Arial, sans-serif" font-size="12" fill="#333">
    ✓ ${toString(out).substring(0, 30)}
  </text>
  `).join('')}
    `;
  }).join('')}
  
  <text x="50" y="780" font-family="Arial, sans-serif" font-size="12" fill="#666">
    Generated by Salesforce EA Discovery Assistant | ${new Date().toLocaleDateString()}
  </text>
</svg>`;
  };

  const exportData = () => {
    try {
      const data = { project: discoveryData.companyName, discoveryData, artifacts };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${discoveryData.companyName.replace(/\s+/g, '-') || 'engagement'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Export successful!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Export failed', 'error');
    }
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {notification.message}
          </div>
        )}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Salesforce EA Discovery</h1>
            <p className="text-xl text-blue-200">AI-powered Enterprise Architecture artifacts</p>
          </div>
          <button onClick={startNew} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 px-8 rounded-xl text-xl font-semibold flex items-center justify-center gap-3 transition shadow-lg mb-12">
            <Plus size={28} />Start New Engagement
          </button>

          {engagements.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Saved Engagements</h2>
              <div className="space-y-4">
                {engagements.map(e => (
                  <div key={e.id} className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6 hover:bg-white/20 transition cursor-pointer group" onClick={() => loadEngagement(e)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{e.company_name || 'Unnamed'}</h3>
                        <p className="text-blue-200 text-sm mt-1">{e.industry || 'No industry'}</p>
                      </div>
                      <button onClick={(ev) => deleteEngagement(e.id, ev)} className="opacity-0 group-hover:opacity-100 transition text-red-400 p-2">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'discovery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {notification.message}
          </div>
        )}
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Discovery Session</h1>
            <div className="flex gap-4">
              <button onClick={() => setShowImport(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center gap-2 transition">
              <Upload size={20} />
      Import from Documents
    </button>
    <button onClick={() => setView('home')} className="text-blue-200 hover:text-white">Back</button>
  </div>
            <button onClick={() => setView('home')} className="text-blue-200 hover:text-white">Back</button>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8 space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">Company Name</label>
              <input type="text" value={discoveryData.companyName} onChange={(e) => setDiscoveryData({...discoveryData, companyName: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter company name" />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Industry</label>
              <input type="text" value={discoveryData.industry} onChange={(e) => setDiscoveryData({...discoveryData, industry: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Financial Services" />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Business Context</label>
              <textarea value={discoveryData.businessContext} onChange={(e) => setDiscoveryData({...discoveryData, businessContext: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="Describe the business..." />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Current Challenges</label>
              <textarea value={discoveryData.currentChallenges} onChange={(e) => setDiscoveryData({...discoveryData, currentChallenges: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="What problems need solving?" />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Strategic Goals</label>
              <textarea value={discoveryData.strategicGoals} onChange={(e) => setDiscoveryData({...discoveryData, strategicGoals: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="1-3 year objectives..." />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Technical Landscape</label>
              <textarea value={discoveryData.technicalLandscape} onChange={(e) => setDiscoveryData({...discoveryData, technicalLandscape: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="Current systems..." />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Constraints</label>
              <textarea value={discoveryData.constraints} onChange={(e) => setDiscoveryData({...discoveryData, constraints: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" placeholder="Budget, compliance..." />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Timeline</label>
                <input type="text" value={discoveryData.timeline} onChange={(e) => setDiscoveryData({...discoveryData, timeline: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12-18 months" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Budget Range</label>
                <input type="text" value={discoveryData.budget} onChange={(e) => setDiscoveryData({...discoveryData, budget: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="$500K - $2M" />
              </div>
            </div>
            <button onClick={generateArtifacts} disabled={loading || !discoveryData.companyName} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-3">
              {loading ? <><Loader2 className="animate-spin" size={24} />Generating...</> : <><FileText size={24} />Generate Salesforce Artifacts</>}
            </button>
          </div>
        </div>
      {showImport && (
  <DocumentImport
    onImportComplete={handleImportComplete}
    onCancel={() => setShowImport(false)}
  />
)}
      </div>
    );
  }

  if (view === 'artifacts' && artifacts) {
    const capMap = artifacts?.capabilityMap || {};
    const currentState = artifacts?.currentStateArchitecture || {};
    const futureState = artifacts?.futureStateArchitecture || {};

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {notification.message}
          </div>
        )}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Salesforce Architecture</h1>
            <div className="flex gap-4">
              <button onClick={() => setView('discovery')} className="text-blue-200 hover:text-white">Edit</button>
              <button onClick={exportData} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"><Download size={20} />Export</button>
              <button onClick={() => setView('home')} className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg">Home</button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/10 p-6 rounded-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Capability Map</h2>
                <button 
                  onClick={() => downloadSVG(generateCapabilityMapSVG(), `${discoveryData.companyName.replace(/\s+/g, '-')}-capability-map.svg`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Diagram
                </button>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-blue-300 mb-3">Business Drivers</h3>
                <div className="flex flex-wrap gap-3">
                  {Array.isArray(capMap.businessDrivers) && capMap.businessDrivers.map((d: any, i: number) => (
                    <div key={i} className="bg-blue-600 px-4 py-2 rounded-lg text-white font-semibold">
                      {toString(d, 'Business Driver')}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'sales', title: 'Sales', icon: '💼' },
                  { key: 'service', title: 'Service', icon: '🎧' },
                  { key: 'marketing', title: 'Marketing', icon: '📧' },
                  { key: 'commerce', title: 'Commerce', icon: '🛒' },
                  { key: 'platformData', title: 'Platform & Data', icon: '⚡' },
                  { key: 'industrySpecific', title: 'Industry-Specific', icon: '🏭' }
                ].map(({ key, title, icon }) => (
                  <div key={key} className="bg-blue-900/30 p-5 rounded-lg border border-blue-500/30">
                    <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                      <span className="text-2xl">{icon}</span> {title}
                    </h3>
                    {Array.isArray(capMap[key]) && capMap[key].map((cap, i) => (
                      <div key={i} className="mb-3 pb-3 border-b border-blue-500/20 last:border-0">
                        <div className="font-semibold text-white">{toString(cap.capability, 'Capability')}</div>
                        <div className="text-sm text-blue-200 mt-1">{toString(cap.description)}</div>
                        <div className="text-xs text-blue-300 mt-2 flex flex-wrap gap-2">
                          {Array.isArray(cap.salesforceProducts) && cap.salesforceProducts.map((p: any, j: number) => (
                            <span key={j} className="bg-blue-700/50 px-2 py-1 rounded">{toString(p, 'Product')}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Current State</h2>
                <button 
                  onClick={() => downloadSVG(generatePaceLayerDiagram(true), `${discoveryData.companyName.replace(/\s+/g, '-')}-current-state.svg`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Diagram
                </button>
              </div>
              <p className="text-white mb-6">{toString(currentState.overview, 'Current state analysis')}</p>
              
              {Array.isArray(currentState.systemsOfRecord) && currentState.systemsOfRecord.map((sys: any, i: number) => (
                <div key={i} className="bg-blue-900/30 p-4 rounded-lg mb-3 border border-blue-500/30">
                  <h4 className="font-bold text-white text-lg mb-2">{toString(sys.name, 'System')}</h4>
                  <p className="text-blue-200 text-sm mb-2">{toString(sys.businessCapability)}</p>
                  <div className="bg-green-900/20 p-3 rounded border border-green-500/30 mt-3">
                    <span className="text-green-300 font-semibold">💡 Salesforce Opportunity: </span>
                    <span className="text-white">{toString(sys.salesforceOpportunity)}</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.isArray(sys.recommendedSalesforceProducts) && sys.recommendedSalesforceProducts.map((p: any, j: number) => (
                        <span key={j} className="bg-green-700 px-3 py-1 rounded-full text-white text-xs font-semibold">
                          {toString(p, 'Product')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/10 p-6 rounded-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Prioritization Matrix</h2>
                <button 
                  onClick={() => downloadSVG(generatePrioritizationMatrix(), `${discoveryData.companyName.replace(/\s+/g, '-')}-prioritization-matrix.svg`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Matrix
                </button>
              </div>
              <div className="text-white text-sm">
                <p className="mb-4">Visual prioritization matrix showing initiatives mapped by business value and implementation effort.</p>
                {Array.isArray(artifacts.prioritizationMatrix) && artifacts.prioritizationMatrix.length > 0 && (
                  <div className="space-y-2">
                    {artifacts.prioritizationMatrix.map((item, i) => (
                      <div key={i} className="bg-blue-900/30 p-3 rounded">
                        <span className="font-bold text-blue-300">#{toString(item.priority)}</span>
                        <span className="ml-3 text-white">{toString(item.initiative)}</span>
                        <span className="ml-3 text-blue-200 text-xs">Value: {toString(item.businessValue)} | Effort: {toString(item.effort)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Strategic Roadmap</h2>
                <button 
                  onClick={() => downloadSVG(generateRoadmapSVG(), `${discoveryData.companyName.replace(/\s+/g, '-')}-roadmap.svg`)}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Roadmap
                </button>
              </div>
              <div className="space-y-4">
                {Array.isArray(artifacts.strategicRoadmap) && artifacts.strategicRoadmap.map((phase, i) => (
                  <div key={i} className="bg-blue-900/50 p-4 rounded-lg text-white">
                    <h3 className="font-bold text-lg mb-3">{toString(phase.phase)}</h3>
                    <div className="mb-2">
                      <strong className="text-blue-200">Initiatives:</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        {Array.isArray(phase.initiatives) && phase.initiatives.map((init: any, j: number) => (
                          <li key={j}>{toString(init)}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-green-200">Expected Outcomes:</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        {Array.isArray(phase.outcomes) && phase.outcomes.map((out: any, j: number) => (
                          <li key={j}>{toString(out)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Future State (Salesforce-Powered)</h2>
                <button 
                  onClick={() => downloadSVG(generatePaceLayerDiagram(false), `${discoveryData.companyName.replace(/\s+/g, '-')}-future-state.svg`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Diagram
                </button>
              </div>
              <p className="text-white mb-6">{toString(futureState.overview, 'Future state vision')}</p>
              
              {futureState.platformComponents && (
                <div className="mb-6 bg-cyan-900/30 p-5 rounded-lg border border-cyan-500/30">
                  <h3 className="text-xl font-bold text-cyan-300 mb-3">Platform Components</h3>
                  <div className="space-y-2 text-sm text-white">
                    <p><strong className="text-cyan-200">Data:</strong> {toString(futureState.platformComponents?.dataUnification, 'N/A')}</p>
                    <p><strong className="text-cyan-200">Integration:</strong> {toString(futureState.platformComponents?.integration, 'N/A')}</p>
                    <p><strong className="text-cyan-200">Analytics:</strong> {toString(futureState.platformComponents?.analytics, 'N/A')}</p>
                    <p><strong className="text-cyan-200">AI:</strong> {toString(futureState.platformComponents?.aiAutomation, 'N/A')}</p>
                  </div>
                </div>
              )}

              {Array.isArray(futureState.systemsOfRecord) && futureState.systemsOfRecord.map((sys: any, i: number) => (
                <div key={i} className="bg-blue-900/30 p-4 rounded-lg mb-3 border border-blue-500/30">
                  <h4 className="font-bold text-white text-lg mb-2">{toString(sys.name, 'System')}</h4>
                  <p className="text-blue-200 text-sm mb-3">{toString(sys.futureVision || sys.description)}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-300 font-semibold">Products:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(sys.salesforceProducts) && sys.salesforceProducts.map((p: any, j: number) => (
                          <span key={j} className="bg-blue-700 px-2 py-1 rounded text-white text-xs">
                            {toString(p, 'Product')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-300 font-semibold">Timeline:</span>
                      <p className="text-white mt-1">{toString(sys.estimatedTimeline || sys.timeline, 'TBD')}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-300 font-semibold">Benefits:</span>
                      <p className="text-white mt-1">
                        {Array.isArray(sys.benefits) 
                          ? sys.benefits.map((b: any) => toString(b)).filter(Boolean).join('; ')
                          : toString(sys.benefits)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 p-8"><div className="max-w-6xl mx-auto text-white">Loading artifacts...</div></div>;
}