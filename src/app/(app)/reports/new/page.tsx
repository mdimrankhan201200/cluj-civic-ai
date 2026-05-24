import { ReportForm } from "@/components/reports/ReportForm";

export default function NewReportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Report a Problem</h1>
        <p className="text-muted-foreground">
          Take a photo and AI will automatically classify the issue
        </p>
      </div>
      <ReportForm />
    </div>
  );
}
