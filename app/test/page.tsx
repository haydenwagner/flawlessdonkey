"use client"

import { supabase } from "@/lib/supabaseClient"

export default function TestPage() {
  const test = async () => {
    const { data, error } = await supabase.from("test").select("*")
    console.log(data, error)
  }

  return (
    <div>
      <button onClick={test}>Test Supabase</button>
    </div>
  )
}
