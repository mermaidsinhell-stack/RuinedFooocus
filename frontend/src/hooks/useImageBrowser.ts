import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'
import type { BrowseImageItem, ImageMetadata } from '@/api/types'

export interface UseImageBrowserReturn {
  images: BrowseImageItem[]
  page: number
  totalPages: number
  totalImages: number
  rangeText: string
  loading: boolean

  selectedImage: BrowseImageItem | null
  metadata: ImageMetadata | null
  metadataLoading: boolean

  search: string
  setSearch: (value: string) => void
  executeSearch: () => void

  setPage: (page: number) => void
  selectImage: (image: BrowseImageItem) => void
  clearSelection: () => void

  updateDB: () => Promise<void>
  updating: boolean
  updateMessage: string | null
}

export function useImageBrowser(): UseImageBrowserReturn {
  const [images, setImages] = useState<BrowseImageItem[]>([])
  const [page, setPageState] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalImages, setTotalImages] = useState(0)
  const [rangeText, setRangeText] = useState('')
  const [loading, setLoading] = useState(false)

  const [selectedImage, setSelectedImage] = useState<BrowseImageItem | null>(null)
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)

  const fetchImages = useCallback(async (p: number, s: string) => {
    setLoading(true)
    try {
      const data = await api.getBrowserImages(p, s)
      setImages(data.images)
      setTotalPages(data.total_pages)
      setTotalImages(data.total_images)
      setRangeText(data.range_text)
    } catch {
      setImages([])
      setTotalPages(1)
      setTotalImages(0)
      setRangeText('')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch images when page or active search changes
  useEffect(() => {
    fetchImages(page, activeSearch)
  }, [page, activeSearch, fetchImages])

  const setPage = useCallback((p: number) => {
    setPageState(p)
    setSelectedImage(null)
    setMetadata(null)
  }, [])

  const executeSearch = useCallback(() => {
    setPageState(1)
    setActiveSearch(search)
    setSelectedImage(null)
    setMetadata(null)
  }, [search])

  const selectImage = useCallback(async (image: BrowseImageItem) => {
    setSelectedImage(image)
    setMetadata(null)
    setMetadataLoading(true)
    try {
      const data = await api.getImageMetadata(image.fullpath)
      setMetadata(data)
    } catch {
      setMetadata(null)
    } finally {
      setMetadataLoading(false)
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedImage(null)
    setMetadata(null)
  }, [])

  const updateDB = useCallback(async () => {
    setUpdating(true)
    setUpdateMessage(null)
    try {
      const result = await api.updateBrowserDB()
      setUpdateMessage(result.message)
      // Refresh the current view
      setPageState(1)
      setActiveSearch('')
      setSearch('')
      setSelectedImage(null)
      setMetadata(null)
    } catch (err) {
      setUpdateMessage(err instanceof Error ? err.message : 'Failed to update database')
    } finally {
      setUpdating(false)
    }
  }, [])

  return {
    images,
    page,
    totalPages,
    totalImages,
    rangeText,
    loading,
    selectedImage,
    metadata,
    metadataLoading,
    search,
    setSearch,
    executeSearch,
    setPage,
    selectImage,
    clearSelection,
    updateDB,
    updating,
    updateMessage,
  }
}
