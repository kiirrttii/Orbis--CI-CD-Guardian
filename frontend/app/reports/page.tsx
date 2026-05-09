'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, Sheet, FileJson } from 'lucide-react'

const reportTypes = [
  {
    name: 'Risk Analysis Report',
    description: 'Comprehensive PDF report with all analysis results and recommendations',
    icon: FileText,
    format: 'PDF',
    lastGenerated: '2 days ago',
  },
  {
    name: 'Excel Export',
    description: 'Detailed spreadsheet with historical data and metrics',
    icon: Sheet,
    format: 'XLSX',
    lastGenerated: '5 days ago',
  },
  {
    name: 'CSV Export',
    description: 'Raw data export for integration with other tools',
    icon: FileJson,
    format: 'CSV',
    lastGenerated: '1 week ago',
  },
]

const reportHistory = [
  {
    id: '1',
    name: 'Q1 2024 Risk Summary.pdf',
    date: 'Mar 15, 2024',
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Monthly Report - February.xlsx',
    date: 'Feb 28, 2024',
    size: '1.2 MB',
  },
  {
    id: '3',
    name: 'Deployment Analysis Jan 2024.csv',
    date: 'Jan 31, 2024',
    size: '456 KB',
  },
  {
    id: '4',
    name: 'Year End Summary 2023.pdf',
    date: 'Dec 29, 2023',
    size: '3.1 MB',
  },
  {
    id: '5',
    name: 'Weekly Snapshot - Dec 22.xlsx',
    date: 'Dec 22, 2023',
    size: '890 KB',
  },
]

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports & Exports</h1>
          <p className="text-muted-foreground">
            Generate and download analysis reports in multiple formats
          </p>
        </div>

        {/* Report Types */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Generate Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon
              return (
                <Card key={report.name} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {report.format}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2">{report.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>

                  <p className="text-xs text-muted-foreground mb-4">Last generated: {report.lastGenerated}</p>

                  <Button className="w-full gap-2 justify-center">
                    <Download className="w-4 h-4" />
                    Generate
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Download History */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Downloads</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="text-left py-4 px-6 font-semibold text-foreground">File Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground">Size</th>
                    <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportHistory.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-border hover:bg-card/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-foreground">{report.name}</td>
                      <td className="py-4 px-6 text-muted-foreground">{report.date}</td>
                      <td className="py-4 px-6 text-right text-muted-foreground">{report.size}</td>
                      <td className="py-4 px-6 text-center">
                        <button className="text-primary hover:underline text-sm font-medium">
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Export Options */}
        <Card className="p-8 bg-accent/5">
          <h2 className="text-2xl font-bold text-foreground mb-4">Scheduled Exports</h2>
          <p className="text-muted-foreground mb-6">
            Set up automatic report generation and delivery to your email
          </p>
          <Button>Configure Scheduled Exports</Button>
        </Card>
      </div>
    </AppLayout>
  )
}
