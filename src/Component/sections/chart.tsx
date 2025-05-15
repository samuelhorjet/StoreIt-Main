"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/Component/ui/card";
import { ChartConfig, ChartContainer } from "@/Component/ui/chart";
import { calculatePercentage, convertFileSize } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

const chartConfig = {
  size: {
    label: "Size",
  },
  used: {
    label: "Used",
    color: "white",
  },
} satisfies ChartConfig;

export const Chart = ({ used = 0 }: { used: number }) => {
  const isMobile = useIsMobile(); // <- Custom hook for responsive logic
  const chartData = [{ storage: used, fill: "white" }];
  // Ensure used is a number
  const usedValue = typeof used === "number" ? used : 0;

  // Calculate percentage more reliably
  const percentage = calculatePercentage(usedValue);
  const endAngle = percentage + 90;
  return (
    <Card className="chart flex flex-col">
      <CardHeader className="chart-details flex-none ml-6 pb-2">
        <CardTitle className="chart-title text-base">
          Available Storage
        </CardTitle>
        <CardDescription className="chart-description text-sm">
          {used ? convertFileSize(used) : "2GB"} / 2GB
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ChartContainer
          config={chartConfig}
          className="chart-container h-80 md:h-45 lg:h-80"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={Number(calculatePercentage(used)) + 90}
            innerRadius={isMobile ? 90 : 50}
            outerRadius={isMobile ? 140 : 80}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="polar-grid"
              polarRadius={isMobile ? [100, 80] : [56, 44]}
            />
            <RadialBar dataKey="storage" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="top"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="chart-total-percentage"
                        >
                          {used && calculatePercentage(used)
                            ? calculatePercentage(used)
                                .toString()
                                .replace(/^0+/, "")
                            : "0"}
                          %
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-white font-semibold mb-10"
                        >
                          Space used
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
