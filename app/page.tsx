'use client'
import Image from "next/image"
import { AssetData, AssetKind, assets } from "./assets"
import { useState } from "react"

export default function Home() {
  let [kind, setKind] = useState<AssetKind | undefined>(undefined)
  let filteredAssets = assets.filter((asset) => kind === undefined || asset.kind === kind)
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
      />,
      <NavigationLink title="Illustration"
        onClick={() => onKindSelected('illustration')}
        selected={kind === 'illustration'}
      />,
      <NavigationLink title="Painting"
        onClick={() => onKindSelected('painting')}
        selected={kind === 'painting'}
      />,
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
  assets: AssetData[],
}) {
  return (
    <div className="flex flex-row flex-wrap">
      {assets.map((asset) => (
        <Tile key={asset.name} asset={asset} />
      ))}
    </div>
  )
}

function assetSrc(asset: AssetData) {
  return `/${asset.name}`
}
function assetAlt(asset: AssetData) {
  return `${asset.title} (${asset.year})`
}

function Tile({ asset }: {
  asset: AssetData,
}) {
  return <div className="w-1/4">
    <Image
      src={assetSrc(asset)}
      alt={assetAlt(asset)}
      width={asset.width ?? 300}
      height={asset.height ?? 300}
    />
  </div>
}