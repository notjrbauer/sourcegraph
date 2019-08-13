import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import React from 'react'
import { toDiagnostic } from '../../../../../../../shared/src/api/types/diagnostic'
import { ExtensionsControllerProps } from '../../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../../shared/src/graphql/schema'
import { PlatformContextProps } from '../../../../../../../shared/src/platform/context'
import { isErrorLike } from '../../../../../../../shared/src/util/errors'
import { parseRepoURI } from '../../../../../../../shared/src/util/url'
import { useQueryParameter } from '../../../../../components/withQueryParameter/WithQueryParameter'
import { DiagnosticListByResource } from '../../../../../diagnostics/list/byResource/DiagnosticListByResource'
import { FileDiffNode } from '../../../../../repo/compare/FileDiffNode'
import { ThemeProps } from '../../../../../theme'
import { ThreadList } from '../../../../threads/list/ThreadList'
import { ThreadListItem } from '../../../../threads/list/ThreadListItem'
import { CampaignImpactSummaryBar } from '../../../common/CampaignImpactSummaryBar'
import { sumDiffStats } from '../../../common/useCampaignImpactSummary'
import { CampaignFormData } from '../CampaignForm'
import { useCampaignPreview } from './useCampaignPreview'

interface Props extends ExtensionsControllerProps, PlatformContextProps, ThemeProps {
    data: CampaignFormData

    className?: string
    location: H.Location
    history: H.History
}

const LOADING = 'loading' as const

/**
 * A campaign preview.
 */
export const CampaignPreview: React.FunctionComponent<Props> = ({ data, className = '', ...props }) => {
    const [campaignPreview, isLoading] = useCampaignPreview(props, data)
    const [query, onQueryChange] = useQueryParameter(props)
    return (
        <div className="campaign-preview">
            <h2 className="d-flex align-items-center">
                Preview
                {isLoading && <LoadingSpinner className="icon-inline ml-3" />}
            </h2>
            {campaignPreview !== LOADING &&
                (isErrorLike(campaignPreview) ? (
                    <div className="alert alert-danger">Error: {campaignPreview.message}</div>
                ) : (
                    // tslint:disable-next-line: jsx-ban-props
                    <div style={isLoading ? { opacity: 0.5, cursor: 'wait' } : undefined}>
                        {campaignPreview.repositoryComparisons.length === 0 &&
                        campaignPreview.diagnostics.nodes.length === 0 ? (
                            <p className="text-muted">No changes</p>
                        ) : (
                            <>
                                <CampaignImpactSummaryBar
                                    impactSummary={{
                                        discussions: campaignPreview.threads.nodes.filter(
                                            ({ kind }) => kind === GQL.ThreadKind.DISCUSSION
                                        ).length,
                                        issues: campaignPreview.threads.nodes.filter(
                                            ({ kind }) => kind === GQL.ThreadKind.ISSUE
                                        ).length,
                                        changesets: campaignPreview.threads.nodes.filter(
                                            ({ kind }) => kind === GQL.ThreadKind.CHANGESET
                                        ).length,
                                        diagnostics: campaignPreview.diagnostics.totalCount,
                                        repositories: campaignPreview.repositories.length,
                                        files: campaignPreview.repositoryComparisons.reduce(
                                            (n, c) => n + (c.fileDiffs.totalCount || 0),
                                            0
                                        ),
                                        diffStat: sumDiffStats(
                                            campaignPreview.repositoryComparisons.map(c => c.fileDiffs.diffStat)
                                        ),
                                    }}
                                    baseURL={location.search}
                                    urlFragmentOrPath="#"
                                    className="mb-4"
                                />
                                {campaignPreview.threads.nodes.length > 0 && (
                                    <>
                                        <a id="threads" />
                                        <ThreadList
                                            {...props}
                                            query={query}
                                            onQueryChange={onQueryChange}
                                            threads={campaignPreview.threads}
                                            showRepository={true}
                                            className="mb-4"
                                        />
                                    </>
                                )}
                                {campaignPreview.diagnostics.nodes.length > 0 && (
                                    <>
                                        <a id="diagnostics" />
                                        <div className="card mb-4">
                                            <h4 className="card-header">Diagnostics</h4>
                                            <DiagnosticListByResource
                                                {...props}
                                                diagnostics={campaignPreview.diagnostics.nodes.map(d => ({
                                                    ...d.data,
                                                    ...toDiagnostic(d.data),
                                                }))}
                                                listClassName="list-group list-group-flush"
                                            />
                                        </div>
                                    </>
                                )}
                                {campaignPreview.repositoryComparisons.length > 0 && (
                                    <>
                                        <a id="changes" />
                                        <div className="card border-left border-right border-top mb-4">
                                            <h4 className="card-header">File changes</h4>
                                            {campaignPreview.repositoryComparisons.flatMap((c, i) =>
                                                c.fileDiffs.nodes.map((d, j) => (
                                                    <FileDiffNode
                                                        key={`${i}:${j}`}
                                                        {...props}
                                                        // TODO!(sqs): hack dont show full uri in diff header
                                                        node={{
                                                            ...d,
                                                            oldPath: parseRepoURI(d.oldPath!).filePath!,
                                                            newPath: parseRepoURI(d.newPath!).filePath!,
                                                        }}
                                                        base={{
                                                            repoName: c.baseRepository.name,
                                                            repoID: c.baseRepository.id,
                                                            rev: c.range.baseRevSpec.expr,
                                                            commitID: c.range.baseRevSpec.object!.oid, // TODO!(sqs)
                                                        }}
                                                        head={{
                                                            repoName: c.headRepository.name,
                                                            repoID: c.headRepository.id,
                                                            rev: c.range.headRevSpec.expr,
                                                            commitID: c.range.headRevSpec.object!.oid, // TODO!(sqs)
                                                        }}
                                                        showRepository={true}
                                                        lineNumbers={false}
                                                        className="mb-0 border-top-0 border-left-0 border-right-0"
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ))}
        </div>
    )
}