'use client'

import { AssetImage } from "@/shared/AssetImage"
import { AssetKind, AssetMetadata, AssetTag } from "@/shared/assets"
import Link from "next/link"
import { useState, useTransition } from "react"
import { hrefForAsset } from "@/shared/href"
import { Button } from "@/shared/Atoms"
import { deleteAsset, updateAsset } from "@/app/console/actions"

export default function AssetEditor({
  asset,
  orderRange,
  kinds,
  tags,
  onUpdate,
  onDelete
}: {
  asset: AssetMetadata,
  orderRange: [number, number],
  kinds: AssetKind[],
  tags: AssetTag[],
  onUpdate?: (asset: AssetMetadata) => void,
  onDelete?: () => void,
}) {
  const [editMode, setEditMode] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCustomKind, setShowCustomKind] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateAsset(asset.id, formData)

      if (result.success && result.asset) {
        setMessage({ type: 'success', text: result.message })
        setEditMode(false)
        if (onUpdate) {
          onUpdate(result.asset)
        }
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  const handleDelete = () => {
    setIsDeleting(true)
  }

  const confirmDelete = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await deleteAsset(asset.id)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        if (onDelete) {
          onDelete()
        }
      } else {
        setMessage({ type: 'error', text: result.message })
        setIsDeleting(false)
      }
    })
  }

  const cancelDelete = () => {
    setIsDeleting(false)
  }

  return (
    <div className="w-full border-l p-4 ml-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{asset.title || 'Untitled'}</h2>
        <div className="flex space-x-2">
          {editMode && !isDeleting && (
            <>
              <Button
                onClick={() => handleSubmit(new FormData(document.querySelector('form') as HTMLFormElement))}
                disabled={isPending}
                text={isPending ? 'Saving...' : 'Save'}
              />
              <Button
                onClick={() => setEditMode(false)}
                kind="gray"
                text="Cancel"
              />
              <Button
                onClick={handleDelete}
                text="Delete"
              />
            </>
          )}
          {!editMode && !isDeleting && (
            <>
              <Button
                onClick={() => setEditMode(true)}
                text='Edit'
              />
              <Button
                onClick={handleDelete}
                text="Delete"
              />
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {isDeleting && (
        <div className="p-4 border border-red-300 bg-red-50 rounded mb-4">
          <h3 className="text-lg font-bold text-red-700 mb-2">Confirm Delete</h3>
          <p className="mb-4">Are you sure you want to delete &quot;{asset.title || 'Untitled'}&quot;? This action cannot be undone.</p>
          <div className="flex space-x-2">
            <Button
              onClick={confirmDelete}
              disabled={isPending}
              text={isPending ? 'Deleting...' : 'Yes, Delete'}
            />
            <Button
              onClick={cancelDelete}
              disabled={isPending}
              kind="gray"
              text="Cancel"
            />
          </div>
        </div>
      )}

      {editMode ? (
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              defaultValue={asset.title || ''}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              name="year"
              defaultValue={asset.year || ''}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Material</label>
            <input
              type="text"
              name="material"
              defaultValue={asset.material || ''}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Kind</label>
            <div className="space-y-2">
              <select
                name="kind"
                defaultValue={asset.kind || ''}
                className="w-full p-2 border rounded"
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    // Reset to the current value and show custom input
                    e.target.value = asset.kind || ''
                    setShowCustomKind(true)
                  }
                }}
              >
                <option value="">Select a kind</option>
                {kinds.map(kind => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
                <option value="__custom__">Add custom kind...</option>
              </select>
              {showCustomKind && (
                <div>
                  <input
                    type="text"
                    name="customKind"
                    placeholder="Enter custom kind"
                    defaultValue=""
                    className="w-full p-2 border rounded mt-2"
                    autoFocus
                  />
                  <div className="flex justify-end mt-1">
                    <Button
                      type="button"
                      kind="gray"
                      onClick={() => setShowCustomKind(false)}
                      text="Cancel"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              defaultValue={asset.tags?.join(', ') || ''}
              className="w-full p-2 border rounded"
            />
            <div className="mt-1 text-xs text-gray-500">
              Available tags: {tags.join(', ')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <div className="flex flex-col">
              <input
                type="number"
                name="order"
                defaultValue={asset.order ?? 0}
                className="w-full p-2 border rounded"
                step="1"
              />
              <div className="flex mt-2 space-x-2">
                <Button
                  type="button"
                  kind="gray"
                  onClick={(e) => {
                    const form = e.currentTarget.closest('form')
                    const orderInput = form?.querySelector('input[name="order"]') as HTMLInputElement
                    if (orderInput) {
                      orderInput.value = (orderRange[0] - 1).toString()
                    }
                  }}
                  text='Move to Top'
                />
                <Button
                  type="button"
                  kind="gray"
                  onClick={(e) => {
                    const form = e.currentTarget.closest('form')
                    const orderInput = form?.querySelector('input[name="order"]') as HTMLInputElement
                    if (orderInput) {
                      orderInput.value = (orderRange[1] + 1).toString()
                    }
                  }}
                  text="Move to Bottom"
                />
              </div>
            </div>
          </div>

          {/* Image displayed at the bottom */}
          <div className="mt-6">
            <AssetImage
              asset={asset}
              size="medium"
              style={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '300px',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Buttons now moved to the top */}
        </form>
      ) : (
        <div className="space-y-2">
          <div><span className="font-medium">ID:</span> {asset.id}</div>
          <div><span className="font-medium">File Name:</span> {asset.fileName}</div>
          <div><span className="font-medium">Kind:</span> {asset.kind || 'Not specified'}</div>
          <div><span className="font-medium">Year:</span> {asset.year || 'Not specified'}</div>
          <div><span className="font-medium">Material:</span> {asset.material || 'Not specified'}</div>
          <div><span className="font-medium">Dimensions:</span> {asset.width}x{asset.height}</div>
          <div><span className="font-medium">Order:</span> {asset.order ?? 0}</div>
          <div><span className="font-medium">Tags:</span> {asset.tags?.join(', ') || 'None'}</div>
          <div className="mt-4 flex space-x-3">
            <Link href={hrefForAsset(asset)} target="_blank" className="text-accent hover:underline">
              View in gallery
            </Link>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  const formData = new FormData()
                  formData.append('title', asset.title || '')
                  formData.append('year', asset.year?.toString() || '')
                  formData.append('material', asset.material || '')
                  formData.append('kind', asset.kind || '')
                  formData.append('customKind', '') // Empty custom kind
                  formData.append('tags', asset.tags?.join(', ') || '')
                  formData.append('order', (orderRange[0] - 1).toString())

                  startTransition(async () => {
                    const result = await updateAsset(asset.id, formData)
                    if (result.success && result.asset) {
                      setMessage({ type: 'success', text: 'Moved to top' })
                      if (onUpdate) {
                        onUpdate(result.asset)
                      }
                    } else {
                      setMessage({ type: 'error', text: result.message })
                    }
                  })
                }}
                disabled={isPending}
                text="Move to Top"
              />
              <Button
                onClick={() => {
                  const formData = new FormData()
                  formData.append('title', asset.title || '')
                  formData.append('year', asset.year?.toString() || '')
                  formData.append('material', asset.material || '')
                  formData.append('kind', asset.kind || '')
                  formData.append('customKind', '') // Empty custom kind
                  formData.append('tags', asset.tags?.join(', ') || '')
                  formData.append('order', (orderRange[1] + 1).toString())

                  startTransition(async () => {
                    const result = await updateAsset(asset.id, formData)
                    if (result.success && result.asset) {
                      setMessage({ type: 'success', text: 'Moved to bottom' })
                      if (onUpdate) {
                        onUpdate(result.asset)
                      }
                    } else {
                      setMessage({ type: 'error', text: result.message })
                    }
                  })
                }}
                disabled={isPending}
                text="Move to Bottom"
              />
            </div>
          </div>

          {/* Image displayed at the bottom */}
          <div className="mt-6">
            <AssetImage
              asset={asset}
              size="medium"
              style={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '300px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}