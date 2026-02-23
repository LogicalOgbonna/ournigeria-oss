import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AIResponseContent, ChartDataPoint, TrendDataPoint } from '../types';
import { formatNaira } from '../lib/format';

const CHART_COLORS = [
  '#059669', '#0891b2', '#d97706', '#65a30d', '#7c3aed',
  '#e11d48', '#0284c7', '#ea580c', '#4f46e5', '#be185d',
];

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

export interface ChartRenderResult {
  barChart?: Buffer;
  donutChart?: Buffer;
  trendLine?: Buffer;
}

@Injectable()
export class ChartService {
  private readonly logger = new Logger(ChartService.name);
  private readonly quickchartUrl: string;

  constructor(private config: ConfigService) {
    this.quickchartUrl =
      this.config.get<string>('QUICKCHART_URL') || 'https://quickchart.io';
  }

  /**
   * Render all chart types present in the AIResponseContent.
   * Returns PNG Buffers keyed by chart type.
   */
  async renderCharts(content: AIResponseContent): Promise<ChartRenderResult> {
    const result: ChartRenderResult = {};
    const tasks: Promise<void>[] = [];

    if (content.barChart && content.barChart.data.length > 0) {
      tasks.push(
        this.renderBarChart(content.barChart.title, content.barChart.data)
          .then((buf) => { result.barChart = buf; })
          .catch((err) => { this.logger.error('Bar chart render failed:', err); }),
      );
    }

    if (content.donutChart && content.donutChart.data.length > 0) {
      tasks.push(
        this.renderDonutChart(content.donutChart.title, content.donutChart.data)
          .then((buf) => { result.donutChart = buf; })
          .catch((err) => { this.logger.error('Donut chart render failed:', err); }),
      );
    }

    if (content.trendLine && content.trendLine.data.length > 0) {
      tasks.push(
        this.renderTrendLine(
          content.trendLine.title,
          content.trendLine.data,
          content.trendLine.lines,
        )
          .then((buf) => { result.trendLine = buf; })
          .catch((err) => { this.logger.error('Trend line render failed:', err); }),
      );
    }

    await Promise.all(tasks);
    return result;
  }

  async renderBarChart(title: string, data: ChartDataPoint[]): Promise<Buffer> {
    const config = {
      type: 'horizontalBar',
      data: {
        labels: data.map((d) => d.name),
        datasets: [{
          data: data.map((d) => d.value),
          backgroundColor: data.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]),
        }],
      },
      options: {
        title: { display: true, text: title, fontSize: 16, fontStyle: 'bold' },
        legend: { display: false },
        scales: {
          xAxes: [{
            ticks: {
              callback: (v: number) => formatNaira(v),
            },
          }],
        },
      },
    };
    return this.renderChart(config);
  }

  async renderDonutChart(title: string, data: ChartDataPoint[]): Promise<Buffer> {
    const config = {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.name),
        datasets: [{
          data: data.map((d) => d.value),
          backgroundColor: data.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]),
        }],
      },
      options: {
        title: { display: true, text: title, fontSize: 16, fontStyle: 'bold' },
        legend: { display: true, position: 'right' },
        plugins: {
          doughnutlabel: {
            labels: [{ text: 'Total', font: { size: 14 } }],
          },
        },
      },
    };
    return this.renderChart(config);
  }

  async renderTrendLine(
    title: string,
    data: TrendDataPoint[],
    lines: { key: string; color: string; label: string }[],
  ): Promise<Buffer> {
    const config = {
      type: 'line',
      data: {
        labels: data.map((d) => String(d.year)),
        datasets: lines.map((line) => ({
          label: line.label,
          data: data.map((d) => d[line.key] as number),
          borderColor: line.color,
          backgroundColor: line.color + '20',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: line.color,
          fill: false,
          lineTension: 0.3,
        })),
      },
      options: {
        title: { display: true, text: title, fontSize: 16, fontStyle: 'bold' },
        legend: { display: true, position: 'bottom' },
        scales: {
          yAxes: [{
            ticks: {
              callback: (v: number) => formatNaira(v),
            },
          }],
        },
      },
    };
    return this.renderChart(config);
  }

  private async renderChart(config: Record<string, unknown>): Promise<Buffer> {
    const res = await fetch(`${this.quickchartUrl}/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chart: config,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        format: 'png',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`QuickChart API error: ${res.status} ${text}`);
    }

    return Buffer.from(await res.arrayBuffer());
  }
}
