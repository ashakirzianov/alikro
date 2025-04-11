import { ImageResponse } from "next/og"
import { assetAlt, AssetMetadata, assetsForQuery, assetSrc, sortAssets } from "@/shared/assets"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { assetHeight, assetWidth } from "@/shared/assets"
import { assetsPageDataForSlug } from "@/app/(detailed)/[...slug]/page"

const WIDTH = 1200
const HEIGHT = 600
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params
  const { query } = assetsPageDataForSlug(slug) ?? { query: null }
  const assets = await getAllAssetMetadata()
  const sorted = sortAssets(assets)
  const filtered = assetsForQuery(sorted, query)
  return new ImageResponse(
    <Preview assets={filtered} />,
    {
      width: WIDTH,
      height: HEIGHT,
    },
  )
}

function Preview({ assets }: {
  assets: AssetMetadata[],
}) {
  const lines = computeLines({
    assets,
    fractions: [40, 45, 15],
    width: WIDTH,
    height: HEIGHT,
  })
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 0 0',
    margin: '0 0 0 0',
    gap: '0 0 0 0',
  }}>
    {
      lines.map(({ height, assets }, index) => {
        return <AssetLine
          key={index}
          assets={assets}
          height={height}
        />
      })
    }
  </div>
}

function AssetLine({ assets, height, }: {
  assets: AssetMetadata[],
  height: number,
}) {
  return <div style={{
    display: 'flex',
    overflow: 'hidden',
    width: '100%',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      height,
      padding: '0 0 0 0',
      margin: '0 0 0 0',
      gap: '0 0 0 0',
    }}>
      {assets.map((asset) =>
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={asset.id}
          src={assetSrc(asset)}
          alt={assetAlt(asset)}
          style={{
            height,
            aspectRatio: `${assetWidth(asset)} / ${assetHeight(asset)}`,
            width: Math.ceil(assetWidth(asset) * (height / assetHeight(asset))),
            objectFit: 'fill',
          }}
        />
      )}
    </div>
  </div >
}

function computeLines({
  assets, fractions, width, height,
}: {
  assets: AssetMetadata[],
  fractions: number[],
  width: number,
  height: number
}) {
  const lines: Array<{
    height: number,
    assets: AssetMetadata[],
  }> = fractions.map(fraction => ({
    height: Math.floor(height * fraction / 100),
    assets: [],
  }))
  let totalWidth = 0
  let currentLineIdx = 0
  for (const asset of assets) {
    if (currentLineIdx >= lines.length) {
      break
    }
    const line = lines[currentLineIdx]
    line.assets.push(asset)
    totalWidth += assetWidth(asset) * (line.height / assetHeight(asset))
    if (totalWidth > width) {
      currentLineIdx += 1
      totalWidth = 0
    }
  }
  return lines
}