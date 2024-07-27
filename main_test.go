package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAdd(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name           string
		a, b, expected int
	}{
		{
			name:     "1 + 2",
			a:        1,
			b:        2,
			expected: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			assert.Equal(t, tt.expected, Add(tt.a, tt.b))
		})
	}
}
