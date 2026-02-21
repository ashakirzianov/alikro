import { AssetMetadata } from "@/shared/asset"
import { hrefForAsset, hrefForMaterial, hrefForYear } from "@/shared/href"
import { parseMaterialString } from "@/shared/material"
import Link from "next/link"

export function AssetDescription({ asset, pathname }: {
    asset: AssetMetadata,
    pathname: string,
}) {
    return (
        <>
            <Link href={hrefForAsset({ assetId: asset.id, pathname })} className="hover:underline">
                {asset.title ?? 'Untitled'}
            </Link>
            {asset.year !== undefined && <>
                &nbsp;&#40;
                <Link href={hrefForYear({ year: asset.year })} className="hover:underline">{asset.year}</Link>
                &#41;
            </>}
            {asset.material && <>
                ,&nbsp;
                <MaterialLinks material={asset.material} />
            </>}
        </>
    )
}

function MaterialLinks({ material }: { material: string }) {
    const elements = parseMaterialString(material)
    return (
        <>
            {elements.map((element, index) => {
                if (element.passive) {
                    return <span key={index}>{element.content.replaceAll(' ', '\u00A0')}</span>
                } else if (element.on) {
                    return <Link key={index} href={hrefForMaterial({ material: `on ${element.content}` })} className="hover:underline">{element.content}</Link>
                } else {
                    return <Link key={index} href={hrefForMaterial({ material: element.content })} className="hover:underline">{element.content}</Link>
                }
            })}
        </>
    )
}