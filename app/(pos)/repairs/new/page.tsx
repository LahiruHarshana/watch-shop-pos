import { RepairForm } from "@/components/pos/repair-form";
import { PageHeader } from "@/components/pos/page-header";

export default function NewRepairPage() {
  return (
    <div>
      <PageHeader title="New repair" description="Create a customer claim ticket" />
      <RepairForm />
    </div>
  );
}
