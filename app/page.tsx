"use client"

import { type FormEvent, useEffect, useState } from "react"
import {
  type HoleElementType,
  type RemoveUnusedPrefabHolesResult,
  parseCircuitJson,
  removeUnusedPrefabHoles,
} from "../src/index"

const HOLE_LABELS: Record<HoleElementType, string> = {
  pcb_hole: "Board holes",
  pcb_plated_hole: "Plated holes",
  pcb_via: "Vias",
}

function FileField({
  id,
  label,
  help,
  onChange,
}: {
  id: string
  label: string
  help: string
  onChange(file: File | undefined): void
}) {
  const [name, setName] = useState("")

  return (
    <label className="file-field" htmlFor={id}>
      <span className="file-label">{label}</span>
      <span className="file-help">{help}</span>
      <input
        id={id}
        type="file"
        accept=".json,.circuit.json,application/json"
        required
        onChange={(event) => {
          const file = event.target.files?.[0]
          setName(file?.name ?? "")
          onChange(file)
        }}
      />
      <span className="file-choice">{name || "Choose Circuit JSON"}</span>
    </label>
  )
}

export default function Home() {
  const [cladFile, setCladFile] = useState<File>()
  const [finalFile, setFinalFile] = useState<File>()
  const [result, setResult] = useState<RemoveUnusedPrefabHolesResult>()
  const [outputUrl, setOutputUrl] = useState("")
  const [outputName, setOutputName] = useState("")
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl)
  }, [outputUrl])

  async function processFiles(event: FormEvent) {
    event.preventDefault()
    if (!cladFile || !finalFile) return

    setProcessing(true)
    setResult(undefined)
    setStatus("")
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setOutputUrl("")

    try {
      const [cladContents, finalContents] = await Promise.all([
        cladFile.text(),
        finalFile.text(),
      ])
      const nextResult = removeUnusedPrefabHoles(
        parseCircuitJson(cladContents),
        parseCircuitJson(finalContents),
      )
      const output = new Blob(
        [`${JSON.stringify(nextResult.circuitJson, null, 2)}\n`],
        { type: "application/json" },
      )
      const baseName = finalFile.name.replace(/(?:\.circuit)?\.json$/i, "")
      setOutputName(`${baseName}.cleaned.circuit.json`)
      setOutputUrl(URL.createObjectURL(output))
      setResult(nextResult)
      setStatus("Your cleaned Circuit JSON is ready.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="brand-row">
          <span className="hosted-badge"><i /> ChatGPT Site</span>
        </div>
        <div className="hero-copy">
          <div>
            <p className="eyebrow">Circuit JSON cleanup utility</p>
            <h1>Keep the routes.<br />Lose the holes.</h1>
          </div>
          <p className="lede">
            Compare any bare clad with its composed circuit. Shared geometry
            identifies prefab holes automatically—no board-specific names or IDs.
          </p>
        </div>
      </header>

      <main className="workflow" aria-label="Prefab hole removal workflow">
        <section className="step-card" aria-labelledby="inputs-title">
          <div className="step-heading">
            <span className="step-number">01</span>
            <div>
              <p className="step-kicker">Reference + design</p>
              <h2 id="inputs-title">Choose the circuits</h2>
            </div>
          </div>
          <form onSubmit={processFiles}>
            <FileField
              id="clad-file"
              label="Bare clad"
              help="Circuit JSON containing the original prefab holes"
              onChange={setCladFile}
            />
            <FileField
              id="final-file"
              label="Composed circuit"
              help="The clad and your routed circuit together"
              onChange={setFinalFile}
            />
            <button
              className="primary-button"
              type="submit"
              disabled={processing || !cladFile || !finalFile}
            >
              <span>{processing ? "Comparing geometry…" : "Remove unused holes"}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <p
            className={`status${status && !result ? " error" : ""}`}
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
        </section>

        <section className="step-card result-card" aria-labelledby="output-title">
          <div className="step-heading">
            <span className="step-number">02</span>
            <div>
              <p className="step-kicker">Clean output</p>
              <h2 id="output-title">Review the result</h2>
            </div>
          </div>

          {result ? (
            <div className="result-content">
              <div className="result-panel">
                <div className="result-title-row">
                  <div>
                    <p className="result-label">Circuit ready</p>
                    <p className="result-value">
                      {result.removedUnusedCladHoleCount.toLocaleString()} unused holes removed
                    </p>
                  </div>
                  <span className="success-dot" />
                </div>
                <dl className="metrics">
                  <div>
                    <dt>Matched</dt>
                    <dd>{result.matchedCladHoleCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Removed</dt>
                    <dd>{result.removedUnusedCladHoleCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Preserved</dt>
                    <dd>{result.preservedUsedCladHoleCount.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>

              <div className="type-breakdown" aria-label="Hole type breakdown">
                {Object.entries(result.countsByType).map(([type, counts]) => (
                  <div className="type-row" key={type}>
                    <span>{HOLE_LABELS[type as HoleElementType]}</span>
                    <span>{counts.removed} removed · {counts.preserved} kept</span>
                  </div>
                ))}
              </div>

              <a className="download-link" href={outputUrl} download={outputName}>
                <span>Download cleaned Circuit JSON</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          ) : (
            <div className="empty-state">
              <div className="board-map" aria-hidden="true">
                {Array.from({ length: 24 }, (_, index) => (
                  <span key={index} className={index % 5 === 0 ? "active" : ""} />
                ))}
              </div>
              <div>
                <p className="empty-title">Geometry does the matching.</p>
                <p className="empty-copy">
                  The cleaner identifies clad holes and clad traces by position,
                  dimensions, layers, and route shape. IDs may differ between files.
                </p>
              </div>
              <ol className="method-list">
                <li><span>01</span> Match the clad inventory</li>
                <li><span>02</span> Find non-clad trace usage</li>
                <li><span>03</span> Remove only unused holes</li>
              </ol>
            </div>
          )}
        </section>
      </main>

      <footer>
        Files stay in your browser and are never uploaded. Used holes and every
        non-hole circuit element remain unchanged.
      </footer>
    </div>
  )
}

