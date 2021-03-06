import * as React from 'react'

import { storiesOf } from '@storybook/react'

import '../../app.scss'

import { action } from '@storybook/addon-actions'
import { OptionsHeader } from './OptionsHeader'

storiesOf('Options - OptionsHeader', module).add('Default', () => (
    <div style={{ maxWidth: 400 }}>
        <OptionsHeader
            version="0.0.0"
            isActivated={true}
            onSettingsClick={action('Settings clicked')}
            onToggleActivationClick={action('Toggle activation clicked')}
        />
    </div>
))
