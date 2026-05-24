import { Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="bg-yellow-100 p-5 rounded-full">
              <ShieldCheck className="h-10 w-10 text-yellow-600" />
            </div>
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Account Pending Approval</h1>
          <p className="text-muted-foreground">
            Your government officer account has been created successfully. An administrator
            will review your request and activate your account shortly.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 space-y-1">
          <p className="font-medium">What happens next?</p>
          <ul className="text-left space-y-1 list-disc list-inside">
            <li>An administrator reviews your account details</li>
            <li>You will get access to the government portal after approval</li>
            <li>Come back later and try to log in again</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <button
              type="submit"
              className={`${buttonVariants({ variant: "outline" })} w-full`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
