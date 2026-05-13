/**
 * Export Utilities
 * 
 * Shared logic for generating PDF, CSV, and JSON reports from analysis data.
 */

import { AnalysisResponse } from './api-types'

/**
 * Generates and downloads a JSON report
 */
export const exportToJSON = (result: AnalysisResponse) => {
  try {
    const exportPayload = {
      prediction_id: result.prediction_id,
      workflow_run_id: result.workflow_run_id,
      target_name: result.target_name,
      inference: result.inference,
      explainability: result.explainability,
      recommendations: result.recommendations.map(r => ({
        recommendation: r.title,
        priority: r.priority,
        action_type: r.action_type
      })),
      ...(result.risk_dimensions ? { risk_dimensions: result.risk_dimensions } : {}),
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analysis_${result.prediction_id}.json`
    link.click()
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('JSON Export failed:', error)
    return false
  }
}

/**
 * Generates and downloads a CSV report
 */
export const exportToCSV = (result: AnalysisResponse) => {
  try {
    const escapeCSV = (val: any) => {
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
    }

    const riskScore = Math.round(result.inference.risk_score)
    const severity = result.inference.severity

    const rows = [
      ['Metric', 'Value'],
      ['Prediction ID', result.prediction_id],
      ['Workflow Run ID', result.workflow_run_id],
      ['Risk Score', riskScore],
      ['Severity', severity],
      ['Model Version', result.inference.model_version],
      ['Confidence Level', result.inference.confidence_level],
      ['Timestamp', result.inference.timestamp],
      [],
      ['Feature', 'Impact (%)', 'Direction'],
      ...result.explainability.map(e => [
        escapeCSV(e.feature),
        Math.round(e.impact_percent),
        e.direction === 'increase_risk' ? 'Increase Risk' : 'Decrease Risk'
      ]),
      [],
      ['recommendation', 'priority', 'type'],
      ...result.recommendations.map(r => [
        escapeCSV(r.title),
        r.priority,
        r.action_type
      ])
    ]

    const csvContent = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analysis_${result.prediction_id}.csv`
    link.click()
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('CSV Export failed:', error)
    return false
  }
}

/**
 * Triggers a browser print-to-PDF flow with a formatted report
 */
export const exportToPDF = (result: AnalysisResponse) => {
  try {
    const dims = result.risk_dimensions
    const ts = new Date(result.inference.timestamp).toLocaleString()

    const dimSection = dims ? `
      <div class="section">
        <h2>Multidimensional Risk Analysis</h2>
        <p class="note">Heuristic interpretation based on code metrics. Not predictive of production outcomes. No vulnerability scanning performed.</p>

        <div class="interp-box">
          <strong>Overall Interpretation</strong><br/>
          ${dims.interpretation_summary}
        </div>

        ${dims.confidence ? `<p><strong>Heuristic Confidence:</strong> ${dims.confidence}</p>` : ''}

        <table>
          <thead>
            <tr><th>Dimension</th><th>Grade</th><th>Score</th><th>Summary</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Maintainability</strong><br/><small>Code quality &amp; complexity</small></td>
              <td class="grade">${dims.maintainability.grade}</td>
              <td>${dims.maintainability.score.toFixed(0)}/100</td>
              <td>${dims.maintainability.summary}</td>
            </tr>
            <tr>
              <td><strong>Deployment Stability</strong><br/><small>Coupling &amp; integration</small></td>
              <td class="grade">${dims.deployment_stability.grade}</td>
              <td>${dims.deployment_stability.score.toFixed(0)}/100</td>
              <td>${dims.deployment_stability.summary}</td>
            </tr>
            <tr>
              <td><strong>Review Complexity</strong><br/><small>Structural heuristic only</small></td>
              <td class="grade">${dims.security_exposure.grade}</td>
              <td>${dims.security_exposure.score.toFixed(0)}/100</td>
              <td>${dims.security_exposure.summary}</td>
            </tr>
          </tbody>
        </table>
      </div>
    ` : ''

    const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Orbis Risk Analysis Report — ${result.prediction_id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 32px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
    h2 { font-size: 15px; font-weight: 600; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; color: #0f172a; }
    .meta { font-size: 11px; color: #64748b; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .kv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .kv { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
    .kv label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; display: block; margin-bottom: 2px; }
    .kv span { font-size: 16px; font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 7px 10px; background: #f1f5f9; color: #475569; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; line-height: 1.5; }
    tr:last-child td { border-bottom: none; }
    .grade { font-weight: 800; font-size: 15px; text-align: center; }
    .interp-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; font-size: 13px; line-height: 1.6; color: #0369a1; }
    .note { font-size: 10.5px; color: #94a3b8; margin-bottom: 10px; font-style: italic; }
    .footer { font-size: 10px; color: #94a3b8; margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Orbis CI/CD Guardian — Risk Analysis Report</h1>
  <p class="meta">Prediction ID: ${result.prediction_id} &nbsp;·&nbsp; Generated: ${ts}</p>

  <div class="section">
    <h2>Overall Deployment Risk</h2>
    <div class="kv-grid">
      <div class="kv"><label>Risk Score</label><span>${Math.round(result.inference.risk_score)}/100</span></div>
      <div class="kv"><label>Severity</label><span>${result.inference.severity}</span></div>
      <div class="kv"><label>Model Confidence</label><span>${result.inference.confidence_level}</span></div>
      <div class="kv"><label>Model Version</label><span>${result.inference.model_version}</span></div>
    </div>
  </div>

  ${dimSection}

  <div class="section">
    <h2>Feature Importance (SHAP)</h2>
    <table>
      <thead><tr><th>Feature</th><th>Impact (%)</th><th>Direction</th></tr></thead>
      <tbody>
        ${result.explainability.map(e => `<tr><td>${e.feature}</td><td>${Math.round(e.impact_percent)}%</td><td>${e.direction === 'increase_risk' ? 'Increases Risk' : 'Decreases Risk'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Recommendations</h2>
    <table>
      <thead><tr><th>Recommendation</th><th>Priority</th><th>Type</th></tr></thead>
      <tbody>
        ${result.recommendations.map(r => `<tr><td>${r.title}</td><td>${r.priority}</td><td>${r.action_type}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <p class="footer">This report is generated by the Orbis CI/CD Guardian heuristic analysis system. Scores are heuristic estimates and do not constitute production monitoring, vulnerability assessments, or real-time deployment predictions.</p>
</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (printWindow) {
      printWindow.document.write(printHTML)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => { printWindow.print() }, 400)
    } else {
      window.print()
    }
    return true
  } catch (error) {
    console.error('PDF Export failed:', error)
    window.print()
    return false
  }
}
