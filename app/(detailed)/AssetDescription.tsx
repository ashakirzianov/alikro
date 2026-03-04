import { AssetMetadata } from "@/shared/asset"
import { hrefForAsset, hrefForMaterial, hrefForYear } from "@/shared/href"
import { parseMaterialString } from "@/shared/material"
import clsx from "clsx"
import Link from "next/link"

export function AssetDescription({ asset, pathname, responsive }: {
    asset: AssetMetadata,
    pathname: string,
    responsive?: boolean,
}) {
    return (
        <>
            <Link href={hrefForAsset({ assetId: asset.id, pathname })} className="hover:underline">
                {asset.title ?? 'Untitled'}
            </Link>
            {asset.year !== undefined && <span className={clsx({
                'hidden sm:inline': responsive,
            })}>
                &nbsp;&#40;
                <Link href={hrefForYear({ year: asset.year })} className="hover:underline">{asset.year}</Link>
                &#41;
            </span>}
            {asset.material && <span className={clsx({
                'hidden lg:inline': responsive,
            })}>
                ,&nbsp;
                <MaterialLinks material={asset.material} />
            </span>}
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