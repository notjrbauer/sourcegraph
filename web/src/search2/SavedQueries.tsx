import AddIcon from '@sourcegraph/icons/lib/Add'
import Loader from '@sourcegraph/icons/lib/Loader'
import * as H from 'history'
import * as React from 'react'
import { map } from 'rxjs/operators/map'
import { Subject } from 'rxjs/Subject'
import { Subscription } from 'rxjs/Subscription'
import { eventLogger } from '../tracking/eventLogger'
import { observeSavedQueries } from './backend'
import { SavedQuery } from './SavedQuery'
import { SavedQueryCreateForm } from './SavedQueryCreateForm'

interface Props {
    location: H.Location
    isLightTheme: boolean
}

interface State {
    savedQueries: GQL.ISavedQuery[]

    /**
     * Whether the saved query creation form is visible.
     */
    creating: boolean

    loading: boolean
    error?: Error
}

export class SavedQueries extends React.Component<Props, State> {
    public state: State = { savedQueries: [], creating: false, loading: true }

    private componentUpdates = new Subject<Props>()
    private subscriptions = new Subscription()

    constructor(props: Props) {
        super(props)

        this.subscriptions.add(
            observeSavedQueries()
                .pipe(
                    map(savedQueries => ({
                        savedQueries: savedQueries.sort((a, b) => {
                            if (a.description < b.description) {
                                return -1
                            }
                            if (a.description === b.description && a.index < b.index) {
                                return -1
                            }
                            return 1
                        }),
                        loading: false,
                    }))
                )
                .subscribe(newState => this.setState(newState as State), err => console.error(err))
        )
    }

    public componentDidMount(): void {
        eventLogger.logViewEvent('SavedQueries')
    }

    public componentWillReceiveProps(newProps: Props): void {
        this.componentUpdates.next(newProps)
    }

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        if (this.state.loading) {
            return <Loader />
        }

        return (
            <div className="saved-queries">
                <div className="saved-queries__header">
                    <h2>Saved queries</h2>

                    <button
                        className="btn btn-primary btn-icon saved-queries__header-button"
                        onClick={this.toggleCreating}
                        disabled={this.state.creating}
                    >
                        <AddIcon className="icon-inline" /> New
                    </button>
                </div>
                {this.state.creating && (
                    <SavedQueryCreateForm onDidCreate={this.onDidCreateSavedQuery} onDidCancel={this.toggleCreating} />
                )}
                {!this.state.creating &&
                    this.state.savedQueries.length === 0 && <p>You don't have any saved queries yet.</p>}
                {this.state.savedQueries.map((savedQuery, i) => (
                    <SavedQuery
                        key={i}
                        savedQuery={savedQuery}
                        isLightTheme={this.props.isLightTheme}
                        onDidDuplicate={this.onDidDuplicateSavedQuery}
                    />
                ))}
            </div>
        )
    }

    private toggleCreating = () => {
        eventLogger.log('SavedQueriesToggleCreating', { creating: !this.state.creating })
        this.setState({ creating: !this.state.creating })
    }

    private onDidCreateSavedQuery = () => {
        eventLogger.log('SavedQueryCreated')
        this.setState({ creating: false })
    }

    private onDidDuplicateSavedQuery = () => {
        eventLogger.log('SavedQueryDuplicated')
    }
}
