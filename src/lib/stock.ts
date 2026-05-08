import { supabase } from "@/integrations/supabase/client";

/**
 * Returns currently available finished-product stock for a given product_code_id.
 * available = sum(production_entries.total_quantity) - sum(stock_issues.quantity)
 *           - sum(sales.quantity where item_type='finished_product')
 */
export async function getFinishedProductAvailable(productCodeId: string): Promise<number> {
  const [prodRes, issueRes, saleRes] = await Promise.all([
    supabase
      .from("production_entries")
      .select("total_quantity, rolls_count, quantity_per_roll")
      .eq("product_code_id", productCodeId)
      .limit(5000),
    supabase
      .from("stock_issues")
      .select("quantity")
      .eq("product_code_id", productCodeId)
      .limit(5000),
    supabase
      .from("sales")
      .select("quantity")
      .eq("item_type", "finished_product")
      .eq("product_code_id", productCodeId)
      .limit(5000),
  ]);

  const produced = (prodRes.data ?? []).reduce((sum: number, p: any) => {
    const qty = Number(p.total_quantity ?? Number(p.rolls_count) * Number(p.quantity_per_roll));
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);
  const issued = (issueRes.data ?? []).reduce((s: number, i: any) => s + Number(i.quantity ?? 0), 0);
  const sold = (saleRes.data ?? []).reduce((s: number, i: any) => s + Number(i.quantity ?? 0), 0);

  return produced - issued - sold;
}
