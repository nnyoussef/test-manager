<script setup lang="ts" generic="T">
import { ref } from 'vue';
import type {
    SelectableItemsTableEmits,
    SelectableItemsTableProps,
} from '@/components/interactive/index.ts';

const props = withDefaults(defineProps<SelectableItemsTableProps<T>>(), {
    rowValue: (arg) => arg,
    rowLabel: (arg) => arg,
    disableSelectRow: false,
});

const emits = defineEmits<SelectableItemsTableEmits>();

let selectedElement: HTMLElement | undefined = undefined;
let createdElements = ref([]);

const onItemClicked = (mv: MouseEvent) => {
    const el: HTMLElement = <HTMLElement>mv.target;
    const label = el.dataset.value;
    if (label) {
        const value = label;
        const position = +(el.dataset.group ?? -1);
        emits('onSelected', { value, label: props.rowLabel(props.items[position]) });
        let tr: HTMLElement = el;
        tr.tagName === 'TD' && (tr = tr.parentElement as HTMLTableRowElement);

        if (!selectedElement) {
            selectedElement = createdElements.value.find(
                (e: HTMLElement) => e.dataset.selected === 'true',
            );
        }
        selectedElement && (selectedElement.dataset.selected = 'false');
        tr.dataset.selected = 'true';
        selectedElement = tr;
    }
};
</script>
<template>
    <table class="data-table">
        <thead>
            <tr>
                <th v-for="name in columnName">
                    {{ name }}
                </th>
                <th></th>
            </tr>
        </thead>
        <tbody @click="disableSelectRow || onItemClicked($event)">
            <tr
                v-for="(item, index) in items"
                ref="createdElements"
                :key="rowValue(item)"
                :data-value="rowValue(item)"
                :data-selected="rowValue(item) === selectedValue && !disableSelectRow"
                :data-group="index"
            >
                <td
                    v-for="col in itemToRowMapper(item)"
                    :data-group="index"
                    :data-value="rowValue(item)"
                >
                    {{ col }}
                </td>
            </tr>
        </tbody>
    </table>
</template>
<style src="@/assets/styles/component/data-table.css" scoped />
