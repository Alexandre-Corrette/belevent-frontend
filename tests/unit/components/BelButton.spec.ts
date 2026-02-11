import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BelButton from '~/components/ui/BelButton.vue'

describe('BelButton', () => {
  it('renders the label', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Valider' },
    })
    expect(wrapper.text()).toContain('Valider')
  })

  it('applies the primary variant by default', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test' },
    })
    expect(wrapper.classes()).toContain('bel-button--primary')
  })

  it('applies the correct variant class', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test', variant: 'danger' },
    })
    expect(wrapper.classes()).toContain('bel-button--danger')
  })

  it('applies the correct size class', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test', size: 'lg' },
    })
    expect(wrapper.classes()).toContain('bel-button--lg')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test', disabled: true },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('is disabled when loading prop is true', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test', loading: true },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.bel-button__spinner').exists()).toBe(true)
  })

  it('shows spinner and hides label when loading', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Valider', loading: true },
    })
    expect(wrapper.find('.bel-button__spinner').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Valider')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test', disabled: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('does not emit click when loading', async () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test', loading: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('renders as submit button when type is submit', () => {
    const wrapper = mount(BelButton, {
      props: { label: 'Test', type: 'submit' },
    })
    expect(wrapper.attributes('type')).toBe('submit')
  })
})