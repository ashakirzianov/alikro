'use client'
import Image from "next/image"
import { Asset, AssetKind, AssetSize, assets } from "./assets"
import { useState } from "react"

export default function Home() {
  let [kind, setKind] = useState<AssetKind | undefined>(undefined)
  let filteredAssets = assets.filter(
    (asset) => kind === undefined || asset.kind === kind)
  filteredAssets = filteredAssets.filter(
    asset => !asset.name.endsWith('.HEIC')
  )
  return (
    <main>
      <Navigation onKindSelected={setKind} kind={kind} />
      <Gallery assets={filteredAssets} />
    </main>
  )
}

function Navigation({
  kind,
  onKindSelected,
}: {
  kind?: AssetKind,
  onKindSelected: (kind?: AssetKind) => void,
}) {
  return (
    <nav className="flex flex-row flex-wrap text-lime-500 text-4xl">
      <NavigationLink title="Alikro"
        onClick={() => onKindSelected()}
      />&nbsp;—&nbsp;
      <NavigationLink title="Drawing"
        onClick={() => onKindSelected('drawing')}
        selected={kind === 'drawing'}
      />,&nbsp;
      <NavigationLink title="Illustration"
        onClick={() => onKindSelected('illustration')}
        selected={kind === 'illustration'}
      />,&nbsp;
      <NavigationLink title="Painting"
        onClick={() => onKindSelected('painting')}
        selected={kind === 'painting'}
      />,&nbsp;
      <NavigationLink title="Poster"
        onClick={() => onKindSelected('poster')}
        selected={kind === 'poster'}
      />
    </nav>
  )
}

function NavigationLink({
  title, selected, onClick,
}: {
  title: string,
  selected?: boolean,
  onClick?: () => void,
}) {
  return <span
    className={`cursor-pointer ${selected ? 'line-through' : ''} hover:italic`}
    onClick={onClick}>
    {title}
  </span>
}

function Gallery({ assets }: {
  assets: Asset[],
}) {
  return (
    <div className="columns-4">
      {assets.map((asset) => (
        <Tile key={asset.name} asset={asset} />
      ))}
    </div>
  )
}

function assetSrc(asset: Asset) {
  return `/${asset.name}`
}
function assetAlt(asset: Asset) {
  return `${asset.title} (${asset.year})`
}
function assetWidth(asset: Asset) {
  return asset.size ? parseInt(asset.size.split('x')[0]) : 300
}
function assetHeight(asset: Asset) {
  return asset.size ? parseInt(asset.size.split('x')[1]) : 300
}
function assetDescription(asset: Asset) {
  return `${asset.title} (${asset.year}), ${asset.material}`
}

function Tile({ asset }: {
  asset: Asset,
}) {
  return <div className="flex flex-col break-inside-avoid-column">
    <Image
      src={assetSrc(asset)}
      alt={assetAlt(asset)}
      width={assetWidth(asset)}
      height={assetHeight(asset)}
    />
    <span className="text-xs text-lime-500">
      {assetDescription(asset)}
    </span>
  </div>
}