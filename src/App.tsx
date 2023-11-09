import JSZip from "jszip";
import "./App.css";
import { bitable } from "@lark-base-open/js-sdk";
import { useState } from "react";
import classNames from "classnames";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [contentFieldName, setContentFieldName] = useState("prompt");
  const exportCaption = async () => {
    if (loading) return;
    setLoading(true);
    // Get the current selection
    const selection = await bitable.base.getSelection();
    console.log("selection: ", selection);
    // Find current table by tableId
    if (!selection.tableId) return;
    const table = await bitable.base.getTableById(selection.tableId);
    console.log("table: ", table);

    // Get table's field meta list
    const fieldMetaList = await table.getFieldMetaList();
    console.log("fieldMetaList: ", fieldMetaList);
    const idField = fieldMetaList.find(({ isPrimary }) => isPrimary);
    console.log("idField: ", idField);
    const contentField = fieldMetaList.find(({ name }) => name === contentFieldName);
    console.log("contentField: ", contentField);

    if (!idField || !contentField) {
      setLoading(false);
      return;
    }

    try {
      // Get all records
      const recordIdList = await table.getRecordIdList();

      console.log("recordIdList: ", recordIdList);

      const zip = new JSZip();

      for (let i = 0; i < recordIdList.length; i++) {
        let fileName = "";
        let content = "";
        const id = await table.getCellString(idField.id, recordIdList[i]!);
        fileName = `${id}.caption`;

        const contentText = await table.getCellString(contentField.id, recordIdList[i]!);
        if (contentText) content = contentText;

        if (fileName && content) {
          zip.file(fileName, content, { binary: false });
        }
      }

      const content = await zip.generateAsync({ type: "blob" });

      const file = `captions.zip`;
      download(content, file);
    } catch {
      setLoading(false);
    }

    // const promptTableMapFile = new File([promptTableMapJsonStr], "export.json", { type: "application/json" });
    // const presetPromptMapFile = new File([presetPromptMapJsonStr], "export.json", { type: "application/json" });

    // download(
    //   promptTableMapFile,
    //   `prompt-table_${new Date().getFullYear()}/${
    //     new Date().getMonth() + 1
    //   }/${new Date().getDate()}:${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}.json`,
    // );

    // download(
    //   presetPromptMapFile,
    //   `preset-prompts_${new Date().getFullYear()}/${
    //     new Date().getMonth() + 1
    //   }/${new Date().getDate()}:${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}.json`,
    // );
    setLoading(false);
  };

  function download(context: Blob, name: string) {
    const a = document.createElement("a");
    a.setAttribute("download", name);
    let url = URL.createObjectURL(context);
    a.href = url;
    a.click();
    a.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <main>
      <button className={classNames("export-btn", { loading: loading })} onClick={exportCaption}>
        {loading ? "导出中..." : "导出"}
      </button>
    </main>
  );
}
