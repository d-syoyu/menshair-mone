// Check Notion database structure - SDK v5 (2025-09-03 API)
import { Client } from "@notionhq/client";

const notion = new Client({ auth: "ntn_m40727709713T23C6Q6SToRXz73TzTf6SzJrRBvwQOM3k5" });

const databases = {
  News: "2c90f2c18d9b80c29900c0a1e11b9772",
  Gallery: "2c90f2c18d9b801ea104fd6857060fbe",
  Products: "2c90f2c18d9b80d59df3ca3616c4d34f",
};

async function checkDatabase(name, dbId) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 ${name} Database`);
  console.log("=".repeat(60));

  try {
    // Get database info (SDK v5)
    const db = await notion.databases.retrieve({ database_id: dbId });
    console.log(`Title: ${db.title?.[0]?.plain_text || "No title"}`);
    console.log(`URL: ${db.url || "No URL"}`);

    // Get data_source_id for SDK v5
    if (db.data_sources && db.data_sources.length > 0) {
      const dataSourceId = db.data_sources[0].id;
      console.log(`Data Source ID: ${dataSourceId}`);

      // Query using dataSources API
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
      });

      console.log(`\nTotal items: ${response.results.length}`);

      // Show properties from first page
      if (response.results.length > 0 && "properties" in response.results[0]) {
        const firstPage = response.results[0];
        console.log(`\nProperty types (from first item):`);
        for (const [propName, prop] of Object.entries(firstPage.properties)) {
          console.log(`  - ${propName}: ${prop.type}`);
        }
      }

      console.log(`\nSample Data:`);
      for (const page of response.results.slice(0, 5)) {
        if ("properties" in page) {
          const props = page.properties;

          // Find title property
          let title = "No title";
          for (const [key, val] of Object.entries(props)) {
            if (val.type === "title" && val.title?.length > 0) {
              title = val.title.map(t => t.plain_text).join("");
              break;
            }
          }

          // Get other properties
          let details = [];
          for (const [key, val] of Object.entries(props)) {
            if (key === "公開" && val.type === "checkbox") {
              details.push(`公開=${val.checkbox}`);
            } else if (val.type === "select" && val.select) {
              details.push(`${key}=${val.select.name}`);
            } else if (val.type === "date" && val.date) {
              details.push(`${key}=${val.date.start}`);
            } else if (val.type === "files" && val.files?.length > 0) {
              details.push(`${key}=📷`);
            }
          }

          console.log(`  • ${title} [${details.join(", ") || "no details"}]`);
        }
      }
    } else {
      console.log(`⚠️ No data_sources found`);
    }

    return { success: true };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("🔍 Checking Notion Databases (SDK v5 / 2025-09-03 API)...\n");

  for (const [name, id] of Object.entries(databases)) {
    await checkDatabase(name, id);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Check completed");
}

main();
