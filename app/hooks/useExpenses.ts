import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export interface Expense {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  recurring: boolean;
  recurrence_period: string | null;
}

export function useExpenses(userId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  async function load() {
    try {
      const fourteenDays = new Date();
      fourteenDays.setDate(fourteenDays.getDate() + 14);

      const { data } = await supabase
        .from("committed_expenses")
        .select("*")
        .eq("user_id", userId)
        .lte("due_date", fourteenDays.toISOString())
        .order("due_date", { ascending: true });

      setExpenses(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function addExpense(
    name: string,
    amount: number,
    dueDate: Date,
    recurring: boolean,
  ) {
    const { error } = await supabase.from("committed_expenses").insert({
      user_id: userId,
      name,
      amount,
      due_date: dueDate.toISOString(),
      recurring,
      recurrence_period: recurring ? "monthly" : null,
    });

    if (error) throw error;
    await load();
  }

  async function deleteExpense(id: string) {
    await supabase.from("committed_expenses").delete().eq("id", id);
    await load();
  }

  return { expenses, loading, addExpense, deleteExpense, reload: load };
}
