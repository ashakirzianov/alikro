'use client'

import { AssetImage } from "@/shared/AssetImage"
import { AssetKind, AssetMetadata, AssetTag } from "@/shared/assets"
import Link from "next/link"
import { useState, useTransition } from "react"
import { deleteAsset, updateAsset } from "./actions"
import { hrefForAsset } from "@/shared/href"

const ASSET_KINDS: AssetKind[] = [
  'painting', 'drawing', 'illustration', 'poster', 'collage', 'tattoo', 'hidden'
]

const ASSET_TAGS: AssetTag[] = [
  'favorite', 'selfportrait', 'secondary'
]

export default function AssetEditor({
  asset,
  orderRange,
  onUpdate,
  onDelete
}: {
  asset: AssetMetadata
  orderRange: [number, number]
  onUpdate?: (asset: AssetMetadata) => void
  onDelete?: () => void
}) {
  const [editMode, setEditMode] = useState(false)
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
        {!editMode && !isDeleting && (
          <div className="flex space-x-2">
            <button
              onClick={() => setEditMode(true)}
              className="px-3 py-1 bg-accent text-white rounded hover:bg-accent/90"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
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
            <button
              onClick={confirmDelete}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={cancelDelete}
              disabled={isPending}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
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
                {ASSET_KINDS.map(kind => (
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
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCustomKind(false)}
                    >
                      Cancel
                    </button>
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
              Available tags: {ASSET_TAGS.join(', ')}
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
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={(e) => {
                    const form = e.currentTarget.closest('form')
                    const orderInput = form?.querySelector('input[name="order"]') as HTMLInputElement
                    if (orderInput) {
                      orderInput.value = (orderRange[1] + 1).toString()
                    }
                  }}
                >
                  Move to top
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={(e) => {
                    const form = e.currentTarget.closest('form')
                    const orderInput = form?.querySelector('input[name="order"]') as HTMLInputElement
                    if (orderInput) {
                      orderInput.value = (orderRange[0] - 1).toString()
                    }
                  }}
                >
                  Move to bottom
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
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
              <button
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
                className="text-sm text-accent hover:underline"
              >
                Move to top
              </button>
              <button
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
                className="text-sm text-accent hover:underline"
              >
                Move to bottom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}