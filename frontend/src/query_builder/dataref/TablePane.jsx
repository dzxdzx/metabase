/* eslint "react/prop-types": "warn" */
import React, { Component, PropTypes } from "react";

import QueryButton from './QueryButton.jsx';
import { createCard } from "metabase/lib/card";
import { createQuery } from "metabase/lib/query";
import { foreignKeyCountsByOriginTable } from 'metabase/lib/schema_metadata';
import inflection from 'inflection';
import cx from "classnames";

export default class TablePane extends Component {
    constructor(props, context) {
        super(props, context);
        this.setQueryAllRows = this.setQueryAllRows.bind(this);
        this.showPane = this.showPane.bind(this);

        this.state = {
            table: undefined,
            tableForeignKeys: undefined,
            pane: "fields"
        };
    }

    static propTypes = {
        query: PropTypes.object.isRequired,
        loadTableFn: PropTypes.func.isRequired,
        show: PropTypes.func.isRequired,
        closeFn: PropTypes.func.isRequired,
        setCardAndRun: PropTypes.func.isRequired,
        table: PropTypes.object
    };

    componentWillMount() {
        this.props.loadTableFn(this.props.table.id).then((result) => {
            this.setState({
                table: result.table,
                tableForeignKeys: result.foreignKeys
            });
        }).catch((error) => {
            this.setState({
                error: "An error occurred loading the table"
            });
        });
    }

    showPane(name) {
        this.setState({ pane: name });
    }

    setQueryAllRows() {
        let card = createCard();
        card.dataset_query = createQuery("query", this.state.table.db_id, this.state.table.id);
        this.props.setCardAndRun(card);
    }

    render() {
        const { table, error } = this.state;
        if (table) {
            var queryButton;
            if (table.rows != null) {
                var text = `See the raw data for ${table.display_name}`
                queryButton = (<QueryButton className="border-bottom border-top mb3" icon="illustration-icon-table" text={text} onClick={this.setQueryAllRows} />);
            }
            var panes = {
                "fields": table.fields.length,
                "metrics": table.metrics.length,
                "segments": table.segments.length,
                // "metrics": 0,
                // "connections": this.state.tableForeignKeys.length
            };
            var tabs = Object.entries(panes).map(([name, count]) =>
                <a key={name} className={cx("Button Button--small", { "Button--active": name === this.state.pane })} onClick={this.showPane.bind(null, name)}>
                    <span className="DataReference-paneCount">{count}</span><span>{inflection.inflect(name, count)}</span>
                </a>
            );

            var pane;
            if (this.state.pane === "connections") {
                const fkCountsByTable = foreignKeyCountsByOriginTable(this.state.tableForeignKeys);
                pane = (
                    <ul>
                    { this.state.tableForeignKeys
                        .sort((a, b) => a.origin.table.display_name.localeCompare(b.origin.table.display_name))
                        .map((fk, index) =>
                            <li key={fk.id} className="p1 border-row-divider">
                                <a className="text-brand text-brand-darken-hover no-decoration" onClick={() => this.props.show("field", fk.origin)}>{fk.origin.table.display_name}
                                { fkCountsByTable[fk.origin.table.id] > 1 ?
                                    <span className="text-grey-3 text-light h5"> via {fk.origin.display_name}</span>
                                : null }
                                </a>
                            </li>
                        )
                    }
                    </ul>
                );
            } else if (this.state.pane) {
                const itemType = this.state.pane.replace(/s$/, "");
                pane = (
                    <ul>
                        { table[this.state.pane].map((item, index) =>
                            <li key={item.id} className="p1 border-row-divider">
                                <a className="text-brand text-brand-darken-hover no-decoration" onClick={() => this.props.show(itemType, item)}>{item.display_name || item.name}</a>
                            </li>
                        )}
                    </ul>
                );
            } else

            var descriptionClasses = cx({ "text-grey-3": !table.description });
            var description = (<p className={descriptionClasses}>{table.description || "No description set."}</p>);

            return (
                <div>
                    <h1>{table.display_name}</h1>
                    {description}
                    {queryButton}
                    <div className="Button-group Button-group--brand text-uppercase">
                        {tabs}
                    </div>
                    {pane}
                </div>
            );
        } else {
            return (
                <div>{error}</div>
            );
        }
    }
}
